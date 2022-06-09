## Releases

Be sure to edit the package.json, and update the version.  Releases won't create
a new NPM package unless the version was updated.  Be sure to create a new version
that matches 
And also edit setup.py and assure that has the same release tag.
New versions of SpiffWorkflow are automatically published to PyPi whenever
a maintainer of our GitHub repository creates a new release on  GitHub.  This
is managed through GitHub's actions.  The configuration of which can be
found in .github/workflows/....
Just create a release in GitHub that mathches the release number in doc/conf.py
