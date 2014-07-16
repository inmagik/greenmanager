from django.conf.urls import patterns, include, url
from .views import IndexView

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'greenmanager.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    url(r'^$', IndexView.as_view(), name="Index"),

)

