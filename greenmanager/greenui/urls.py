from django.conf.urls import patterns, include, url
from .views import IndexView, TerritoryList, TerritoryAdd, TerritoryEdit

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'greenmanager.views.home', name='home'),
    # url(r'^blog/', include('blog.urls')),
    url(r'^territory/$', TerritoryList.as_view(), name="territory_list"),
    url(r'^territory-add/$', TerritoryAdd.as_view(), name="territory_add"),
    url(r'^territory-edit/(?P<pk>\d)/$', TerritoryEdit.as_view(), name="territory_edit"),
    url(r'^$', IndexView.as_view(), name="index"),
    

)

