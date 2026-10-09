def add_tenant_security_requirement(result, generator, request, public):
    for path_item in result.get("paths", {}).values():
        for operation in path_item.values():
            if not isinstance(operation, dict):
                continue

            security_requirements = operation.get("security")
            if not security_requirements:
                continue

            for requirement in security_requirements:
                if requirement and "TenantId" not in requirement:
                    requirement["TenantId"] = []

    return result
