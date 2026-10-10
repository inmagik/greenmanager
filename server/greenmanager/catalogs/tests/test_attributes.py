from catalogs.attributes import validate_attributes
from catalogs.models import AttributeDefinition, ElementClass, ElementClassAttribute
from django.test import TestCase
from rest_framework import serializers


class ValidateAttributesTests(TestCase):
    def setUp(self):
        self.element_class = ElementClass.objects.create(
            code="test",
            name="Test",
            category="other",
            geometry_type="point",
            quantity_unit="count",
            species_mode="none",
        )
        self.attributes = {}
        for code, data_type, extra, required in (
            ("count", "number", {}, False),
            ("label", "text", {}, False),
            ("lit", "boolean", {}, False),
            ("shape", "choice", {"choices": ["round", "square"]}, True),
            ("installed", "date", {}, False),
            ("height", "number", {"is_measure": True}, False),
        ):
            attribute = AttributeDefinition.objects.create(
                code=f"t_{code}", name=code, data_type=data_type, **extra
            )
            ElementClassAttribute.objects.create(
                element_class=self.element_class, attribute=attribute, required=required
            )
            self.attributes[code] = attribute

    def errors(self, values, previous=None):
        with self.assertRaises(serializers.ValidationError) as raised:
            validate_attributes(self.element_class, values, previous)
        return {
            key: error["code"]
            for key, error in raised.exception.detail["attributes"].items()
        }

    def test_valid_values_are_cleaned(self):
        cleaned = validate_attributes(
            self.element_class,
            {
                "t_count": 3,
                "t_label": "  north  ",
                "t_lit": False,
                "t_shape": "round",
                "t_installed": "2024-03-01",
                "t_count_empty": None,
            },
        )

        self.assertEqual(
            cleaned,
            {
                "t_count": 3,
                "t_label": "north",
                "t_lit": False,
                "t_shape": "round",
                "t_installed": "2024-03-01",
            },
        )

    def test_errors_by_attribute(self):
        errors = self.errors(
            {
                "t_count": "3",
                "t_lit": "yes",
                "t_installed": "01/03/2024",
                "t_height": 2.5,
                "unknown": 1,
            }
        )

        self.assertEqual(
            errors,
            {
                "t_count": "attribute_invalid_type",
                "t_lit": "attribute_invalid_type",
                "t_installed": "attribute_invalid_type",
                "t_height": "attribute_is_measure",
                "unknown": "attribute_unknown",
                "t_shape": "attribute_required",
            },
        )

    def test_text_of_spaces_is_empty(self):
        self.assertEqual(
            validate_attributes(
                self.element_class, {"t_shape": "round", "t_label": "   "}
            ),
            {"t_shape": "round"},
        )
        self.assertEqual(
            self.errors({"t_shape": "   "}), {"t_shape": "attribute_required"}
        )

    def test_invalid_choice(self):
        self.assertEqual(
            self.errors({"t_shape": "oval"}), {"t_shape": "attribute_invalid_choice"}
        )

    def test_values_no_longer_in_the_class_are_kept_if_unchanged(self):
        previous = {"t_shape": "round", "old": "x"}
        self.attributes["label"].retired = True
        self.attributes["label"].save()

        cleaned = validate_attributes(
            self.element_class, {"t_shape": "round", "old": "x"}, previous
        )

        self.assertEqual(cleaned, {"t_shape": "round", "old": "x"})
        self.assertEqual(
            self.errors({"t_shape": "round", "old": "y"}, previous),
            {"old": "attribute_unknown"},
        )
        self.assertEqual(
            self.errors({"t_shape": "round", "t_label": "new"}),
            {"t_label": "attribute_retired"},
        )
