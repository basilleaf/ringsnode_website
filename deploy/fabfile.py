from __future__ import print_function
import sys
import os
import socket
import time
from fabric.api import env, lcd, run, abort, local
from fabric.contrib.console import confirm
from secrets import PROD_DIR
import getpass

"""
    This must be run on the admin server.

    Run like so:
        fab deploy admin
        fab deploy production

    To update the galleries and press release directories:
        fab deploy admin_galleries
        fab deploy production_galleries

    * The reason this is run on admin is people work on different
    local dev environments and it was getting tedious maintaining this
    fabfile working on Windows machines.

"""

################################################################################
# Configuration
################################################################################

REPO = 'https://github.com/SETI/pds-website.git'
branch = 'master'

admin_host = 'admin.pds-rings.csc.seti.org'
prod_host = 'server2.pds-rings.seti.org'
mark_host = 'mark.local'

# a home directory location for the repo on admin and production
# don't forget trailing slashes here:

admin_repo = '~/pds-website/'  # your local copy of the repo on admin
                                     # this script deploys the website
                                     # generated by this install either
                                     # to admin or to production web roots

mark_repo = '~/GitHub/pds-website/'

prod_staging_dir = '~/website_staging/'  # an rsync target on the production machine
                                         # since you can't rsync directly into
                                         # prod web root from another machine

git_revision = ''  # use this to roll back to past commit, leave blank for latest
jekyll_version = '' #'_3.8.3_' # leave blank to go with system default

################################################################################
# End of configuration
################################################################################

admin_website = 'https://{}'.format(admin_host)
prod_website = 'https://{}'.format(prod_host)
mark_website = 'http://{}'.format(mark_host)

PROD_USR = getpass.getuser()  # expects same user name on all machines
                              # = local, admin, prod
                              # This is not true for Matt, so...
if PROD_USR == 'matthewt': PROD_USR = 'mtiscareno'
env.hosts = [admin_host]      # only admin server has remote logins
prod_login = '{}@{}'.format(PROD_USR, prod_host)
prod_staging_path = '{}@{}:{}'.format(PROD_USR, prod_host, prod_staging_dir)

# Needed for website directories parallel to "website/"
# For example, "website_galleries/"

links = [
    "_config.production.yml",
    "_config.yml",
    "_data",
    "_includes",
    "_layouts",
    "_posts",
    "_sass"
]

def deploy():
    """ do some setup things """
    pass  # there are no setup things


def admin(suffix=""):
    """ This script will update a local repo in user home directory
        to the branch and git_revision on github,
        build the site in user local directory, then
        deploy the website to admin server web root.
        You must be logged into admin running this script on admin.
    """

    # get the latest from github
    with lcd(admin_repo):
        local('git checkout {}'.format(branch))
        if git_revision:
            local('git checkout {}'.format(git_revision))
        local('git pull')

    # build the site and then move into web root
    with lcd(admin_repo + "website" + suffix + "/"):

        # Make sure necessary files or symlinks are present
        if suffix:
            for link in links:
                dest = "../website" + suffix + "/" + link
                if not os.path.exists(dest):
                    os.symlink("../website/" + link, dest)

        local("jekyll {} build --config _config.yml,_config.production.yml".format(jekyll_version))

        # copy the website to the production directory
        rsync_cmd = "sudo rsync -r %s --exclude=*.tif --exclude=*.tiff --exclude=*.tgz --exclude=*.tar.gz _site/ %s. "

        # first do a dry run:
        local(rsync_cmd % ('--dry-run --itemize-changes ', PROD_DIR))
        if confirm("The above was a dry run. If the above looks good, push to admin site:"):
            local(rsync_cmd % ('', PROD_DIR))
            print("\n*** Admin Website Has Been Updated! ***\n Take a look: {}".format(admin_website))
            sys.exit()
        else:
            print("\nDeployment Aborted\n")

def admin_galleries():
    admin(suffix="_galleries")

def mark(suffix=""):
    """ Deploy script for Mark's laptop
    """

    # DON'T get the latest from github
#     with lcd(admin_repo):
#         local('git checkout {}'.format(branch))
#         if git_revision:
#             local('git checkout {}'.format(git_revision))
#         local('git pull')

    # build the site and then move into web root
    with lcd(mark_repo + "website" + suffix + "/"):

        # Make sure necessary files or symlinks are present
        if suffix:
            for link in links:
                dest = "../website" + suffix + "/" + link
                if not os.path.exists(dest):
                    os.symlink("../website/" + link, dest)

        local("jekyll {} build --config _config.yml,_config.production.yml".format(jekyll_version))

        # copy the website to the production directory
        rsync_cmd = "sudo rsync -r %s --exclude=*.tif --exclude=*.tiff --exclude=*.tgz --exclude=*.tar.gz _site/ %s. "

        # first do a dry run:
        local(rsync_cmd % ('--dry-run --itemize-changes ', PROD_DIR))
        if confirm("The above was a dry run. If the above looks good, push to admin site:"):
            local(rsync_cmd % ('', PROD_DIR))
            print("\n*** Website Has Been Updated! ***\n Take a look: {}".format(mark_website))
            sys.exit()
        else:
            print("\nDeployment Aborted\n")

def mark_galleries():
    mark(suffix="_galleries")

def production(suffix=""):
    """ rsyncs admin server from admin_repo to production server web root
    """

    if confirm("""
            -----

            You will be deploying the website from the admin server
            generated in {}
            to the production website at pds-rings.seti.org.

            During this process you will be prompted for a password, where
            you will need to enter your production server sudo password.

            Do you want to continue?

            """.format(admin_repo, default=False)):

        with lcd(admin_repo + "website" + suffix + "/"):

            rsync_cmd = "rsync -r {} --exclude=*.tif --exclude=*.tiff --exclude=*.tgz --exclude=*.tar.gz _site/ {}. "
            print(rsync_cmd.format('', prod_staging_path))
            print(prod_staging_path)

            # move the site over to the production server staging directory
            # this step is here bc server settings = you can't deploy remotely
            # directly into web root
            local(rsync_cmd.format('', prod_staging_path))

            # shell into production, rsync from home dir staging into web root
            local('ssh -t {} "sudo rsync -r {} {}."'.format(prod_login, prod_staging_dir, PROD_DIR))

            print("\n*** Production Website Has Been Updated! ***\n Take a look: \n https://pds-rings.seti.org")

def production_galleries():
    production(suffix="_galleries")

