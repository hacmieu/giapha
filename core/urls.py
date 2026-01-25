from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    # Home
    path('', views.HomeView.as_view(), name='home'),
    
    # Members
    path('members/', views.MemberListView.as_view(), name='members'),
    path('member/<int:pk>/', views.MemberDetailView.as_view(), name='member_detail'),
    path('member/add/', views.MemberCreateView.as_view(), name='member_create'),
    path('member/<int:pk>/edit/', views.MemberUpdateView.as_view(), name='member_update'),
    path('member/<int:pk>/delete/', views.MemberDeleteView.as_view(), name='member_delete'),
    
    # Family Tree
    path('phadoo/', views.FamilyTreeView.as_view(), name='family_tree'),
    path('phadoo/chi/<int:chi_number>/', views.FamilyTreeView.as_view(), name='family_tree_chi'),
    
    # Ton Ti (Hierarchy Guide)
    path('tonti/', views.TonTiView.as_view(), name='tonti'),
    path('genogram/', views.GoJSGenogramView.as_view(), name='genogram'),
    path('relationships/', views.RelationshipsView.as_view(), name='relationships'),
]
