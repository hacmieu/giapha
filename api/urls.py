from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'api'

router = DefaultRouter()
router.register(r'members', views.FamilyMemberViewSet, basename='member')
router.register(r'chi', views.ChiViewSet, basename='chi')

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', views.StatsView.as_view(), name='stats'),
    path('tree/<int:chi_number>/', views.TreeDataView.as_view(), name='tree_data'),
    path('graph/', views.GraphDataView.as_view(), name='graph_data'),
    path('relationships/', views.RelationshipDataView.as_view(), name='relationships_data'),
]
