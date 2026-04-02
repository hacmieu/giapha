from django import forms
from .models import FamilyMember, Chi, SpouseRelation


class MemberBasicForm(forms.ModelForm):
    """Bước 1: Thông tin cơ bản"""
    class Meta:
        model = FamilyMember
        fields = ['name', 'gender', 'chi', 'generation', 'member_type',
                  'birth_order', 'birth_date', 'death_date', 'notes', 'photo']
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
            'death_date': forms.TextInput(attrs={
                'class': 'form-input', 'placeholder': 'Để trống nếu còn sống',
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
    """Bước 2: Quan hệ gia đình (Cha / Mẹ)"""
    class Meta:
        model = FamilyMember
        fields = ['father', 'mother']
        widgets = {
            'father': forms.Select(attrs={'class': 'form-input'}),
            'mother': forms.Select(attrs={'class': 'form-input'}),
        }

    def __init__(self, *args, **kwargs):
        instance = kwargs.get('instance')
        super().__init__(*args, **kwargs)

        # Cha: chỉ hiện nam, đời trên
        father_qs = FamilyMember.objects.filter(gender='male').select_related('chi')
        if instance and instance.generation:
            father_qs = father_qs.filter(generation=instance.generation - 1)
        self.fields['father'].queryset = father_qs.order_by('chi__number', 'birth_order', 'name')
        self.fields['father'].empty_label = '-- Chọn Cha --'
        self.fields['father'].label_from_instance = lambda obj: (
            f"{obj.person_code or '?'} — {obj.name}"
            + (f" (Chi {obj.chi.number})" if obj.chi else "")
        )

        # Mẹ: chỉ hiện nữ, cùng đời hoặc đời trên
        mother_qs = FamilyMember.objects.filter(gender='female').select_related('chi')
        if instance and instance.generation:
            mother_qs = mother_qs.filter(generation__in=[instance.generation - 1, instance.generation])
        self.fields['mother'].queryset = mother_qs.order_by('chi__number', 'birth_order', 'name')
        self.fields['mother'].empty_label = '-- Chọn Mẹ --'
        self.fields['mother'].label_from_instance = lambda obj: (
            f"{obj.person_code or '?'} — {obj.name}"
            + (f" (Chi {obj.chi.number})" if obj.chi else "")
        )


class SpouseRelationForm(forms.ModelForm):
    """Form thêm vợ/chồng"""
    class Meta:
        model = SpouseRelation
        fields = ['wife', 'wife_order', 'marriage_date', 'notes']
        widgets = {
            'wife': forms.Select(attrs={'class': 'form-input'}),
            'wife_order': forms.NumberInput(attrs={
                'class': 'form-input', 'min': 1, 'value': 1,
            }),
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
