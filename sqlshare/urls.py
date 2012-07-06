from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^/*$', 'sqlshare.views.home', name='home'),
    url(r'^/*user/?$', 'sqlshare.views.user'),
    url(r'^/*proxy/?(?P<path>.*)$', 'sqlshare.views.proxy'),
)
