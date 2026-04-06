from django import forms
from .models import DraftSubmission, DraftPerson


class DraftSubmissionForm(forms.ModelForm):
    """Form tạo bản khai mới — thông tin người khai"""
    is_in_family = forms.ChoiceField(
        label='Bạn có nằm trong gia phả không?',
        choices=[('yes', 'Có — tôi là thành viên trong họ'), ('no', 'Không — tôi khai hộ cho người khác')],
        initial='yes',
        widget=forms.RadioSelect(attrs={'class': 'mr-2'}),
    )
    submitter_gender = forms.ChoiceField(
        label='Giới tính của bạn',
        choices=[('male', 'Nam'), ('female', 'Nữ')],
        initial='male',
        required=False,
        widget=forms.RadioSelect(attrs={'class': 'mr-2'}),
    )

    class Meta:
        model = DraftSubmission
        fields = ['submitter_name', 'submitter_phone', 'submitter_relation', 'notes']
        widgets = {
            'submitter_name': forms.TextInput(attrs={
                'class': 'draft-input', 'placeholder': 'VD: Vũ Văn An',
                'autofocus': True,
            }),
            'submitter_phone': forms.TextInput(attrs={
                'class': 'draft-input', 'placeholder': 'VD: 0912 345 678',
            }),
            'submitter_relation': forms.TextInput(attrs={
                'class': 'draft-input',
                'placeholder': 'VD: Con trai trưởng Chi 4, Đời 6',
            }),
            'notes': forms.Textarea(attrs={
                'class': 'draft-input', 'rows': 2,
                'placeholder': 'Ghi chú thêm nếu có...',
            }),
        }
        labels = {
            'submitter_name': 'Họ và tên bạn',
            'submitter_phone': 'Số điện thoại (để admin liên hệ)',
            'submitter_relation': 'Bạn thuộc Chi mấy / Đời thứ mấy?',
            'notes': 'Ghi chú',
        }


class DraftPersonForm(forms.ModelForm):
    """Form thêm/sửa người trong bản khai"""
    class Meta:
        model = DraftPerson
        fields = [
            'name', 'gender', 'relation_to_submitter',
            'birth_date', 'death_date', 'death_date_lunar', 'is_deceased',
            'birth_order',
            'chi_number', 'generation',
            'father_temp_id', 'mother_temp_id',
            'notes', 'photo',
        ]
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'draft-input', 'placeholder': 'VD: Vũ Văn Bình',
                'autofocus': True,
            }),
            'gender': forms.Select(attrs={'class': 'draft-input'}),
            'relation_to_submitter': forms.Select(attrs={'class': 'draft-input'}),
            'birth_date': forms.TextInput(attrs={
                'class': 'draft-input', 'placeholder': 'VD: 1965 hoặc 15/03/1965',
            }),
            'death_date': forms.TextInput(attrs={
                'class': 'draft-input', 'placeholder': 'Để trống nếu còn sống',
            }),
            'death_date_lunar': forms.TextInput(attrs={
                'class': 'draft-input', 'placeholder': 'VD: 26/12 hoặc 26/12/2019',
            }),
            'is_deceased': forms.CheckboxInput(attrs={'class': 'mr-2'}),
            'birth_order': forms.NumberInput(attrs={
                'class': 'draft-input', 'placeholder': 'VD: 10, 20, 30... (bước 10)', 'min': 1,
            }),
            'chi_number': forms.NumberInput(attrs={
                'class': 'draft-input', 'placeholder': 'Nếu biết', 'min': 1, 'max': 8,
            }),
            'generation': forms.NumberInput(attrs={
                'class': 'draft-input', 'placeholder': 'Nếu biết', 'min': 0,
            }),
            'father_temp_id': forms.Select(attrs={'class': 'draft-input'}),
            'mother_temp_id': forms.Select(attrs={'class': 'draft-input'}),
            'notes': forms.Textarea(attrs={
                'class': 'draft-input', 'rows': 4,
                'placeholder': 'Ghi tất cả những gì bạn nhớ: nghề nghiệp, địa chỉ, '
                    'thông tin nghe kể từ người lớn, quan hệ với ai...\n'
                    'VD: "Nghe bác cả kể là ông nội mất khoảng năm 1970, '
                    'là con thứ 2 của cụ Bảy"',
            }),
            'photo': forms.ClearableFileInput(attrs={'class': 'draft-input'}),
        }
        labels = {
            'name': 'Họ và tên',
            'gender': 'Giới tính',
            'relation_to_submitter': 'Quan hệ với bạn',
            'birth_date': 'Năm sinh (nếu nhớ)',
            'death_date': 'Năm mất dương lịch (nếu nhớ)',
            'death_date_lunar': 'Ngày giỗ âm lịch (nếu nhớ)',
            'is_deceased': 'Đã mất',
            'birth_order': 'Thứ tự sắp xếp (bước 10)',
            'chi_number': 'Chi số (nếu biết)',
            'generation': 'Đời thứ (nếu biết)',
            'father_temp_id': 'Cha là ai?',
            'mother_temp_id': 'Mẹ là ai?',
            'notes': 'Ghi chú (quan trọng nhất!)',
            'photo': 'Ảnh (nếu có)',
        }

    def __init__(self, *args, submission=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['gender'].choices = [('', '-- Chọn --')] + list(DraftPerson.GENDER_CHOICES)

        # Build choices for parent/spouse from existing persons in this submission
        person_choices = [('', '-- Không chọn --')]
        if submission:
            for p in submission.persons.order_by('temp_id'):
                # Skip self when editing
                if self.instance and self.instance.pk and p.pk == self.instance.pk:
                    continue
                person_choices.append((p.temp_id, f"#{p.temp_id} {p.name}"))

        self.fields['father_temp_id'].widget = forms.Select(
            attrs={'class': 'draft-input'}, choices=person_choices
        )
        self.fields['mother_temp_id'].widget = forms.Select(
            attrs={'class': 'draft-input'}, choices=person_choices
        )


class DraftLookupForm(forms.Form):
    """Form tra cứu bản khai bằng mã"""
    draft_code = forms.CharField(
        max_length=12,
        widget=forms.TextInput(attrs={
            'class': 'draft-input', 'placeholder': 'VD: DK-a3f8b2c1',
            'autofocus': True,
        }),
        label='Mã bản khai',
    )
