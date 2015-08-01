from django.shortcuts import render
#from django.views.generic import TemplateView, ListView
#from django.views.generic.edit import CreateView, UpdateView, DeleteView
from vanilla import TemplateView, ListView
from vanilla import CreateView, UpdateView, DeleteView
from vegetation.models import Territory
from django.core.urlresolvers import reverse


class IndexView(TemplateView):
    template_name = "greenui/index.html"


class TerritoryList(ListView):
    model = Territory
    template_name = "greenui/territory_list.html"



from leaflet.forms.widgets import LeafletWidget
from django import forms

class TerritoryForm(forms.ModelForm):
    #geom = forms.PolygonField(srid=4326, widget= forms.OSMWidget(attrs={'map_width': 800, 'map_height': 500}), required=False)
    class Meta:
        model = Territory
        fields = ['id', 'name', 'description', 'geom']
        widgets = {'geom': LeafletWidget()}


class TerritoryAdd(CreateView):
    model = Territory
    template_name = "greenui/territory_add.html"
    form_class = TerritoryForm
    def get_success_url(self):
        return reverse("territory_list")


class TerritoryEdit(UpdateView):
    model = Territory
    template_name = "greenui/territory_edit.html"
    form_class = TerritoryForm
    def get_success_url(self):
        return reverse("territory_list")

class TerritoryDelete(DeleteView):
    model = Territory
    template_name = "greenui/territory_delete.html"
    def get_success_url(self):
        return reverse("territory_list")
