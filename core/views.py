from django.views.generic import TemplateView, ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404

from .models import Family, Chi, FamilyMember


class EditorRequiredMixin(UserPassesTestMixin):
    """Mixin yêu cầu quyền editor để chỉnh sửa"""
    def test_func(self):
        return self.request.user.is_authenticated and self.request.user.can_edit_members()


class HomeView(TemplateView):
    """Trang chủ - Hướng dẫn gia phả"""
    template_name = 'core/home.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['family'] = Family.objects.first()
        context['total_members'] = FamilyMember.objects.count()
        context['total_dinh'] = FamilyMember.objects.filter(is_dinh=True).count()
        context['chi_list'] = Chi.objects.annotate(
            member_count=Count('members'),
            dinh_count=Count('members', filter=Q(members__is_dinh=True))
        )
        return context


class MemberListView(ListView):
    """Danh sách thành viên với search và filter"""
    model = FamilyMember
    template_name = 'core/members.html'
    context_object_name = 'members'
    paginate_by = 50
    
    def get_queryset(self):
        qs = super().get_queryset().select_related('chi', 'father', 'mother')
        
        # Search
        search = self.request.GET.get('q')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(notes__icontains=search))
        
        # Filter by Chi
        chi = self.request.GET.get('chi')
        if chi:
            qs = qs.filter(chi__number=chi)
        
        # Filter by Gender
        gender = self.request.GET.get('gender')
        if gender:
            qs = qs.filter(gender=gender)
        
        # Filter by Type
        member_type = self.request.GET.get('type')
        if member_type == 'dinh':
            qs = qs.filter(is_dinh=True)
        elif member_type:
            qs = qs.filter(member_type=member_type)
        
        return qs
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['chi_list'] = Chi.objects.all()
        context['total_count'] = FamilyMember.objects.count()
        context['dinh_count'] = FamilyMember.objects.filter(is_dinh=True).count()
        context['search_query'] = self.request.GET.get('q', '')
        context['selected_chi'] = self.request.GET.get('chi', '')
        context['selected_gender'] = self.request.GET.get('gender', '')
        context['selected_type'] = self.request.GET.get('type', '')
        return context


class MemberDetailView(DetailView):
    """Chi tiết thành viên"""
    model = FamilyMember
    template_name = 'core/member_detail.html'
    context_object_name = 'member'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        member = self.object
        context['children'] = member.children
        context['siblings'] = member.siblings
        context['spouses'] = member.spouses.all()
        return context


class MemberCreateView(LoginRequiredMixin, EditorRequiredMixin, CreateView):
    """Thêm thành viên mới"""
    model = FamilyMember
    template_name = 'core/member_form.html'
    fields = ['name', 'gender', 'chi', 'generation', 'is_dinh', 'member_type', 
              'father', 'mother', 'birth_order', 'birth_date', 'death_date', 'notes', 'photo']
    success_url = reverse_lazy('core:members')
    
    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Thêm Thành Viên Mới'
        context['chi_list'] = Chi.objects.all()
        context['members'] = FamilyMember.objects.all().order_by('name')
        return context


class MemberUpdateView(LoginRequiredMixin, EditorRequiredMixin, UpdateView):
    """Chỉnh sửa thành viên"""
    model = FamilyMember
    template_name = 'core/member_form.html'
    fields = ['name', 'gender', 'chi', 'generation', 'is_dinh', 'member_type',
              'father', 'mother', 'birth_order', 'birth_date', 'death_date', 'notes', 'photo']
    
    def get_success_url(self):
        return reverse_lazy('core:member_detail', kwargs={'pk': self.object.pk})
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = f'Sửa: {self.object.name}'
        context['chi_list'] = Chi.objects.all()
        context['members'] = FamilyMember.objects.exclude(pk=self.object.pk).order_by('name')
        return context


class MemberDeleteView(LoginRequiredMixin, EditorRequiredMixin, DeleteView):
    """Xóa thành viên"""
    model = FamilyMember
    template_name = 'core/member_confirm_delete.html'
    success_url = reverse_lazy('core:members')


class FamilyTreeView(TemplateView):
    """Phả đồ - Family Tree visualization"""
    template_name = 'core/family_tree.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['chi_list'] = Chi.objects.annotate(member_count=Count('members'))
        
        chi_number = kwargs.get('chi_number', 0)
        context['selected_chi'] = chi_number
        
        if chi_number:
            context['members'] = FamilyMember.objects.filter(
                chi__number=chi_number
            ).select_related('father', 'mother', 'chi').prefetch_related('spouses')
        else:
            # Show ancestors (Thủy Tổ)
            context['members'] = FamilyMember.objects.filter(
                Q(chi__isnull=True) | Q(generation=1)
            ).select_related('father', 'mother', 'chi').prefetch_related('spouses')
        
        return context


class TonTiView(TemplateView):
    """Tôn Ti - Hướng dẫn về Chi Phái Cành Nhánh"""
    template_name = 'core/tonti.html'


class GoJSGenogramView(TemplateView):
    """Phả đồ GoJS Interactive"""
    template_name = 'core/genogram_gojs.html'


class RelationshipsView(TemplateView):
    """Bảng quan hệ chi tiết - vợ/chồng, con nuôi, cháu ngoại..."""
    template_name = 'core/relationships.html'
