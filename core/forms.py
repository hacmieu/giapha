from django import forms
from .models import FamilyMember, Chi, SpouseRelation


class MemberBasicForm(forms.ModelForm):
    """Bước 1: Thông tin cơ bản"""
    class Meta:
        model = FamilyMember
        fields = ['name', 'gender', 'chi', 'generation', 'member_type',
                  'birth_order', 'birth_date', 'is_deceased', 'death_date', 'death_date_lunar',
                  'notes', 'photo']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-input', 'placeholder': 'VD: Vũ Văn An',
                'autofocus': True,
            }),
            'gender': forms.Select(attrs={'class': 'form-input'}),
            'chi': forms.Select(attrs={'class': 'form-input'}),
            'generation': forms.NumberInput(attrs={
                'class': 'form-input', 'placeholder': 'Tự tính từ cha', 'min': 0,
            }),
            'member_type': forms.Select(attrs={'class': 'form-input'}),
            'birth_order': forms.NumberInput(attrs={
                'class': 'form-input', 'placeholder': 'VD: 10, 20, 30... (bước 10)', 'min': 1,
            }),
            'birth_date': forms.TextInput(attrs={
                'class': 'form-input', 'placeholder': 'VD: 15/03/1985',
            }),
            'is_deceased': forms.CheckboxInput(attrs={
                'class': 'form-checkbox', 'id': 'id_is_deceased',
            }),
            'death_date': forms.TextInput(attrs={
                'class': 'form-input', 'placeholder': 'VD: 20/01/2020',
                'id': 'id_death_date',
            }),
            'death_date_lunar': forms.TextInput(attrs={
                'class': 'form-input', 'placeholder': 'VD: 15/08 (ngày/tháng âm lịch)',
                'id': 'id_death_date_lunar',
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-input', 'rows': 3,
                'placeholder': 'Nghề nghiệp, địa chỉ, thông tin khác...',
            }),
            'photo': forms.ClearableFileInput(attrs={'class': 'form-input'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['chi'].empty_label = '-- Chọn Chi --'
        self.fields['generation'].required = False
        self.fields['gender'].choices = [('', '-- Chọn --')] + list(FamilyMember.GENDER_CHOICES)


class MemberFamilyForm(forms.ModelForm):
    """Bước 2: Quan hệ gia đình (Cha / Mẹ) — hidden inputs, autocomplete on frontend"""
    class Meta:
        model = FamilyMember
        fields = ['father', 'mother']
        widgets = {
            'father': forms.HiddenInput(attrs={'id': 'id_father'}),
            'mother': forms.HiddenInput(attrs={'id': 'id_mother'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['father'].queryset = FamilyMember.objects.all()
        self.fields['father'].required = False
        self.fields['mother'].queryset = FamilyMember.objects.all()
        self.fields['mother'].required = False


class SpouseRelationForm(forms.ModelForm):
    """Form thêm vợ/chồng"""
    class Meta:
        model = SpouseRelation
        fields = ['wife', 'wife_order', 'status', 'marriage_date', 'notes']
        widgets = {
            'wife': forms.Select(attrs={'class': 'form-input'}),
            'wife_order': forms.NumberInput(attrs={
                'class': 'form-input', 'min': 1, 'value': 1,
            }),
            'status': forms.Select(attrs={'class': 'form-input'}),
            'marriage_date': forms.TextInput(attrs={
                'class': 'form-input', 'placeholder': 'VD: 1985',
            }),
            'notes': forms.TextInput(attrs={
                'class': 'form-input', 'placeholder': 'Ghi chú',
            }),
        }

    def __init__(self, *args, husband=None, **kwargs):
        super().__init__(*args, **kwargs)
        wife_qs = FamilyMember.objects.filter(gender='female').select_related('chi')
        if husband and husband.generation is not None:
            wife_qs = wife_qs.filter(generation=husband.generation)
        self.fields['wife'].queryset = wife_qs.order_by('name')
        self.fields['wife'].empty_label = '-- Chọn Vợ --'
        self.fields['wife'].label_from_instance = lambda obj: (
            f"{obj.person_code or '?'} — {obj.name}"
        )


class AddChildForm(forms.ModelForm):
    """Form thêm con nhanh (từ trang chi tiết cha)"""
    class Meta:
        model = FamilyMember
        fields = ['name', 'gender', 'birth_order', 'birth_date', 'member_type']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-input', 'placeholder': 'Họ và tên con',
            }),
            'gender': forms.Select(attrs={'class': 'form-input'}),
            'birth_order': forms.NumberInput(attrs={
                'class': 'form-input', 'placeholder': 'VD: 10, 20, 30... (bước 10)', 'min': 1,
            }),
            'birth_date': forms.TextInput(attrs={
                'class': 'form-input', 'placeholder': 'VD: 1990',
            }),
            'member_type': forms.Select(attrs={'class': 'form-input'}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['gender'].choices = [('', '-- Chọn --')] + list(FamilyMember.GENDER_CHOICES)
