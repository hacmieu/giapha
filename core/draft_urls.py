from django.urls import path
from . import draft_views

urlpatterns = [
    # Public — không cần đăng nhập
    path('', draft_views.DraftLandingView.as_view(), name='draft_landing'),
    path('tao-moi/', draft_views.DraftCreateView.as_view(), name='draft_create'),
    path('tra-cuu/', draft_views.DraftLookupView.as_view(), name='draft_lookup'),
    path('<str:draft_code>/', draft_views.DraftDetailView.as_view(), name='draft_detail'),
    path('<str:draft_code>/them/', draft_views.DraftAddPersonView.as_view(), name='draft_add_person'),
    path('<str:draft_code>/sua/<int:person_pk>/', draft_views.DraftEditPersonView.as_view(), name='draft_edit_person'),
    path('<str:draft_code>/xoa/<int:person_pk>/', draft_views.DraftDeletePersonView.as_view(), name='draft_delete_person'),
    path('<str:draft_code>/gui/', draft_views.DraftSubmitView.as_view(), name='draft_submit'),
    path('<str:draft_code>/thu-hoi/', draft_views.DraftRecallView.as_view(), name='draft_recall'),
    path('<str:draft_code>/json/', draft_views.draft_export_json, name='draft_json'),
    path('<str:draft_code>/upload-excel/', draft_views.draft_upload_excel, name='draft_upload_excel'),
    path('<str:draft_code>/noi-quan-he/', draft_views.DraftRelationshipBuilderView.as_view(), name='draft_relationship_builder'),
    path('<str:draft_code>/api/save-relation/', draft_views.draft_save_relation, name='draft_save_relation'),
    path('<str:draft_code>/api/quick-add/', draft_views.draft_quick_add_person, name='draft_quick_add_person'),
    path('<str:draft_code>/api/edit-person/<int:person_pk>/', draft_views.draft_edit_person_ajax, name='draft_edit_person_ajax'),

    # Admin — cần đăng nhập + quyền editor
    path('quan-ly/danh-sach/', draft_views.AdminDraftListView.as_view(), name='admin_draft_list'),
    path('quan-ly/<str:draft_code>/', draft_views.AdminDraftReviewView.as_view(), name='admin_draft_review'),
    path('quan-ly/<str:draft_code>/set-action/<int:person_pk>/', draft_views.admin_draft_set_action, name='admin_draft_set_action'),
    path('quan-ly/<str:draft_code>/duyet/', draft_views.admin_draft_approve, name='admin_draft_approve'),
    path('quan-ly/<str:draft_code>/tu-choi/', draft_views.admin_draft_reject, name='admin_draft_reject'),
]
