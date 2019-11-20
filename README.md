```yaml
uses: bobbyrward/actions-dpn-python-version-check@master
with:
  pypi_hostname: ${secrets.blah_hostname}
  pypi_username: ${secrets.blah_username}
  pypi_password: ${secrets.blah_password}
  package_name: my_python_package_name
  version: 1.2.15
```
