from django.views.generic import TemplateView, ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy, reverse
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404, redirect, render
from django.contrib import messages
from django.http import JsonResponse

from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required

from .models import Family, Chi, FamilyMember, SpouseRelation
from .forms import MemberBasicForm, MemberFamilyForm, SpouseRelationForm, AddChildForm


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
        context['wife_relations'] = SpouseRelation.objects.filter(husband=member).select_related('wife').order_by('wife_order')
        context['add_child_form'] = AddChildForm()
        context['spouse_form'] = SpouseRelationForm(husband=member)
        context['can_edit'] = self.request.user.is_authenticated and self.request.user.can_edit_members()
        return context


class MemberCreateView(LoginRequiredMixin, EditorRequiredMixin, CreateView):
    """Thêm thành viên — form mới gọn gàng"""
    model = FamilyMember
    form_class = MemberBasicForm
    template_name = 'core/member_form.html'
    
    def get_initial(self):
        initial = super().get_initial()
        # Pre-fill from query params (cha truyền vào)
        father_pk = self.request.GET.get('father')
        if father_pk:
            try:
                father = FamilyMember.objects.select_related('chi').get(pk=father_pk)
                initial['chi'] = father.chi
                initial['generation'] = (father.generation or 0) + 1
                initial['member_type'] = 'blood'
            except FamilyMember.DoesNotExist:
                pass
        return initial
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['title'] = 'Thêm Thành Viên Mới'
        context['is_create'] = True
        
        father_pk = self.request.GET.get('father')
        if father_pk:
            context['preset_father'] = FamilyMember.objects.filter(pk=father_pk).first()
        
        # Family form for step 2 (server-rendered together)
        context['family_form'] = MemberFamilyForm()
        return context
    
    def form_valid(self, form):
        form.instance.created_by = self.request.user
        
        # Also grab father/mother from family fields
        father_pk = self.request.POST.get('father')
        mother_pk = self.request.POST.get('mother')
        if father_pk:
            form.instance.father_id = father_pk
        if mother_pk:
            form.instance.mother_id = mother_pk
        
        response = super().form_valid(form)
        messages.success(self.request, f'Đã thêm {self.object.name} — Mã: {self.object.person_code or "chưa có"}')
        return response
    
    def get_success_url(self):
        return reverse('core:member_detail', kwargs={'pk': self.object.pk})


class MemberUpdateView(LoginRequiredMixin, EditorRequiredMixin, UpdateView):
    """Chỉnh sửa thành viên"""
    model = FamilyMember
    form_class = MemberBasicForm
    template_name = 'core/member_form.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        member = self.object
        context['title'] = f'Sửa: {member.name}'
        context['is_create'] = False
        context['family_form'] = MemberFamilyForm(instance=member)
        # Spouse & children for edit form
        context['wife_relations'] = SpouseRelation.objects.filter(
            husband=member
        ).select_related('wife').order_by('wife_order')
        context['children'] = member.children
        return context
    
    def form_valid(self, form):
        father_pk = self.request.POST.get('father')
        mother_pk = self.request.POST.get('mother')
        form.instance.father_id = father_pk if father_pk else None
        form.instance.mother_id = mother_pk if mother_pk else None
        
        response = super().form_valid(form)
        messages.success(self.request, f'Đã cập nhật {self.object.name}')
        return response
    
    def get_success_url(self):
        return reverse('core:member_detail', kwargs={'pk': self.object.pk})


class MemberDeleteView(LoginRequiredMixin, EditorRequiredMixin, DeleteView):
    """Xóa thành viên"""
    model = FamilyMember
    template_name = 'core/member_confirm_delete.html'
    success_url = reverse_lazy('core:members')
    
    def form_valid(self, form):
        name = self.object.name
        response = super().form_valid(form)
        messages.success(self.request, f'Đã xóa {name}')
        return response


class AddChildView(LoginRequiredMixin, EditorRequiredMixin, CreateView):
    """Thêm con nhanh từ trang chi tiết cha"""
    model = FamilyMember
    form_class = AddChildForm
    
    def form_valid(self, form):
        father = get_object_or_404(FamilyMember, pk=self.kwargs['pk'])
        child = form.save(commit=False)
        child.father = father
        child.chi = father.chi
        child.generation = (father.generation or 0) + 1
        child.created_by = self.request.user
        child.save()
        messages.success(self.request, f'Đã thêm con: {child.name}')
        return redirect('core:member_detail', pk=father.pk)
    
    def form_invalid(self, form):
        messages.error(self.request, 'Lỗi khi thêm con. Vui lòng kiểm tra lại.')
        return redirect('core:member_detail', pk=self.kwargs['pk'])


class AddSpouseView(LoginRequiredMixin, EditorRequiredMixin, CreateView):
    """Thêm vợ cho thành viên nam"""
    model = SpouseRelation
    form_class = SpouseRelationForm
    
    def form_valid(self, form):
        husband = get_object_or_404(FamilyMember, pk=self.kwargs['pk'])
        relation = form.save(commit=False)
        relation.husband = husband
        relation.save()
        # Also add to M2M spouses
        husband.spouses.add(relation.wife)
        messages.success(self.request, f'Đã thêm vợ: {relation.wife.name}')
        return redirect('core:member_detail', pk=husband.pk)
    
    def form_invalid(self, form):
        messages.error(self.request, 'Lỗi khi thêm vợ.')
        return redirect('core:member_detail', pk=self.kwargs['pk'])


class ReorderChildrenView(LoginRequiredMixin, EditorRequiredMixin, TemplateView):
    """Sắp xếp thứ tự con"""
    template_name = 'core/reorder_children.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        parent = get_object_or_404(FamilyMember, pk=self.kwargs['pk'])
        context['parent'] = parent
        context['children'] = parent.children
        return context
    
    def post(self, request, *args, **kwargs):
        parent = get_object_or_404(FamilyMember, pk=self.kwargs['pk'])
        order_data = request.POST.get('order', '')
        if order_data:
            for i, child_pk in enumerate(order_data.split(','), start=1):
                FamilyMember.objects.filter(pk=int(child_pk)).update(birth_order=i)
            messages.success(request, 'Đã cập nhật thứ tự con')
        return redirect('core:member_detail', pk=parent.pk)


@login_required
@require_POST
def ajax_add_spouse(request, pk):
    """AJAX: Thêm vợ cho thành viên"""
    husband = get_object_or_404(FamilyMember, pk=pk)
    wife_id = request.POST.get('wife_id')
    if not wife_id:
        return JsonResponse({'error': 'Chưa chọn vợ'}, status=400)
    wife = get_object_or_404(FamilyMember, pk=int(wife_id))
    wife_order = int(request.POST.get('wife_order', 1) or 1)
    status = request.POST.get('status', 'married')
    marriage_date = request.POST.get('marriage_date', '')
    notes = request.POST.get('notes', '')

    relation, created = SpouseRelation.objects.get_or_create(
        husband=husband, wife=wife,
        defaults={
            'wife_order': wife_order,
            'status': status,
            'marriage_date': marriage_date or None,
            'notes': notes,
        }
    )
    if not created:
        return JsonResponse({'error': f'{wife.name} đã là vợ rồi'}, status=400)
    husband.spouses.add(wife)
    return JsonResponse({
        'id': relation.pk,
        'wife_id': wife.pk,
        'wife_name': wife.name,
        'wife_order': relation.wife_order,
        'status': relation.status,
        'status_display': relation.get_status_display(),
        'marriage_date': relation.marriage_date or '',
    })


@login_required
@require_POST
def ajax_remove_spouse(request, pk, relation_id):
    """AJAX: Xóa quan hệ vợ"""
    relation = get_object_or_404(SpouseRelation, pk=relation_id, husband_id=pk)
    wife = relation.wife
    relation.delete()
    husband = get_object_or_404(FamilyMember, pk=pk)
    if not SpouseRelation.objects.filter(husband=husband, wife=wife).exists():
        husband.spouses.remove(wife)
    return JsonResponse({'ok': True})


@login_required
@require_POST
def ajax_add_child(request, pk):
    """AJAX: Thêm con cho thành viên"""
    parent = get_object_or_404(FamilyMember, pk=pk)
    child_id = request.POST.get('child_id')
    name = request.POST.get('name', '').strip()
    gender = request.POST.get('gender', '')

    if child_id:
        # Link an existing member as child
        child = get_object_or_404(FamilyMember, pk=int(child_id))
        if parent.gender == 'male':
            child.father = parent
        else:
            child.mother = parent
        child.save()
    elif name and gender:
        # Create a new child
        child = FamilyMember(
            name=name,
            gender=gender,
            chi=parent.chi if parent.gender == 'male' else None,
            generation=(parent.generation or 0) + 1,
            member_type='blood',
            created_by=request.user,
        )
        if parent.gender == 'male':
            child.father = parent
        else:
            child.mother = parent
        child.save()
    else:
        return JsonResponse({'error': 'Chưa chọn hoặc nhập tên con'}, status=400)

    return JsonResponse({
        'id': child.pk,
        'name': child.name,
        'gender': child.gender,
        'birth_order': child.birth_order,
        'person_code': child.person_code or '',
    })


@login_required
@require_POST
def ajax_remove_child(request, pk, child_id):
    """AJAX: Gỡ con (chỉ bỏ quan hệ cha/mẹ, không xóa thành viên)"""
    parent = get_object_or_404(FamilyMember, pk=pk)
    child = get_object_or_404(FamilyMember, pk=child_id)
    if parent.gender == 'male' and child.father_id == pk:
        child.father = None
    elif parent.gender == 'female' and child.mother_id == pk:
        child.mother = None
    else:
        return JsonResponse({'error': 'Không phải con của thành viên này'}, status=400)
    child.save()
    return JsonResponse({'ok': True})


def api_members_by_generation(request):
    """API nhỏ: Lấy danh sách thành viên theo đời (AJAX cho form)"""
    gen = request.GET.get('generation')
    gender = request.GET.get('gender')
    chi_id = request.GET.get('chi')
    
    qs = FamilyMember.objects.select_related('chi').all()
    if gen:
        qs = qs.filter(generation=int(gen))
    if gender:
        qs = qs.filter(gender=gender)
    if chi_id:
        qs = qs.filter(chi_id=int(chi_id))
    
    data = [
        {
            'id': m.pk,
            'text': f"{m.person_code or '?'} — {m.name}" + (f" (Chi {m.chi.number})" if m.chi else ""),
        }
        for m in qs.order_by('chi__number', 'birth_order', 'name')[:200]
    ]
    return JsonResponse(data, safe=False)


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


class GenealogyViewerView(TemplateView):
    """Xem phả đồ GoJS"""
    template_name = 'core/genealogy_viewer.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        from .models import Genealogy
        context['genealogies'] = Genealogy.objects.all()
        return context
