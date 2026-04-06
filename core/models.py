from django.db import models
from django.urls import reverse
from django.conf import settings


class Family(models.Model):
    """Thông tin dòng họ"""
    name = models.CharField(max_length=100, verbose_name='Tên dòng họ')
    village = models.CharField(max_length=200, verbose_name='Làng')
    address = models.TextField(verbose_name='Địa chỉ')
    chi_count = models.PositiveIntegerField(default=8, verbose_name='Số Chi')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Dòng họ'
        verbose_name_plural = 'Các dòng họ'
    
    def __str__(self):
        return self.name


class Chi(models.Model):
    """Chi trong dòng họ"""
    family = models.ForeignKey(Family, on_delete=models.CASCADE, related_name='chi_set')
    number = models.PositiveIntegerField(verbose_name='Số Chi')
    name = models.CharField(max_length=100, blank=True, verbose_name='Tên Chi')
    description = models.TextField(blank=True, verbose_name='Mô tả')
    
    class Meta:
        verbose_name = 'Chi'
        verbose_name_plural = 'Các Chi'
        ordering = ['number']
        unique_together = ['family', 'number']
    
    def __str__(self):
        return f"Chi {self.number}" + (f" - {self.name}" if self.name else "")
    
    @property
    def head(self):
        """Trưởng chi - người đời đầu của chi này"""
        return self.members.filter(generation=1).first()
    
    def get_member_count(self):
        """Get member count - use this method or annotate() in views"""
        return self.members.count()
    
    def get_dinh_count(self):
        """Get dinh count - use this method or annotate() in views"""
        return self.members.filter(is_dinh=True).count()


class FamilyMember(models.Model):
    """Thành viên dòng họ"""
    GENDER_CHOICES = [
        ('male', 'Nam'),
        ('female', 'Nữ'),
    ]
    MEMBER_TYPE_CHOICES = [
        ('blood', 'Dòng trực hệ'),
        ('spouse_in', 'Dâu/Rể'),
        ('child_out', 'Cháu ngoại'),
        ('adopted_in', 'Nhập tịch'),       # UC03: Người từ chi/họ khác nhập vào
        ('adopted_child', 'Con nuôi'),     # Con nuôi được nhận vào họ
    ]
    
    # Basic info
    legacy_id = models.CharField(max_length=50, unique=True, null=True, blank=True, verbose_name='ID cũ')
    person_code = models.CharField(max_length=12, unique=True, null=True, blank=True, 
                                   verbose_name='Mã người', help_text='VD: 04.05.001 (Chi.Đời.STT)')
    name = models.CharField(max_length=100, verbose_name='Họ và tên')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, verbose_name='Giới tính')
    chi = models.ForeignKey(Chi, null=True, blank=True, on_delete=models.SET_NULL, 
                           related_name='members', verbose_name='Chi')
    generation = models.PositiveIntegerField(null=True, blank=True, verbose_name='Đời thứ')
    is_dinh = models.BooleanField(default=False, verbose_name='Tính Đinh')
    member_type = models.CharField(max_length=20, choices=MEMBER_TYPE_CHOICES, 
                                   default='blood', verbose_name='Loại thành viên')
    is_public = models.BooleanField(default=True, verbose_name='Công khai')
    attributes = models.JSONField(default=dict, blank=True, verbose_name='Thuộc tính mở rộng')
    
    # Family relations
    father = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, 
                               related_name='children_from_father', verbose_name='Cha')
    mother = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL, 
                               related_name='children_from_mother', verbose_name='Mẹ')
    spouses = models.ManyToManyField('self', blank=True, symmetrical=True, 
                                     verbose_name='Vợ/Chồng')
    
    # Additional info
    birth_order = models.PositiveIntegerField(null=True, blank=True, verbose_name='Con thứ')
    birth_date = models.CharField(max_length=50, blank=True, verbose_name='Ngày sinh')
    death_date = models.CharField(max_length=50, blank=True, verbose_name='Ngày mất (dương lịch)')
    death_date_lunar = models.CharField(max_length=50, blank=True, verbose_name='Ngày mất (âm lịch)')
    is_deceased = models.BooleanField(default=False, verbose_name='Đã mất')
    notes = models.TextField(blank=True, verbose_name='Ghi chú')
    photo = models.ImageField(upload_to='members/', null=True, blank=True, verbose_name='Ảnh')
    
    # Metadata
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True,
                                   on_delete=models.SET_NULL, related_name='created_members')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Thành viên'
        verbose_name_plural = 'Thành viên'
        ordering = ['chi', 'generation', 'birth_order', 'name']
    
    def __str__(self):
        chi_info = f"Chi {self.chi.number}" if self.chi else "Chưa xác định"
        return f"{self.name} ({chi_info})"
    
    def save(self, *args, **kwargs):
        # Clean legacy_id
        if self.legacy_id == "":
            self.legacy_id = None
        
        # AUTO-CALCULATE GENERATION từ cha/mẹ
        if self.generation is None:
            if self.father and self.father.generation is not None:
                self.generation = self.father.generation + 1
            elif self.mother and self.mother.generation is not None:
                self.generation = self.mother.generation + 1
        
        # AUTO-SET IS_DINH: Con TRAI của Đinh → tự động là Đinh
        # (Con gái Đinh: admin gán thủ công cho trường hợp chồng mất, về đóng góp)
        if self.gender == 'male' and self.member_type in ('blood', 'adopted_in', 'adopted_child'):
            if self.father and self.father.is_dinh:
                self.is_dinh = True
        
        # AUTO-GENERATE PERSON_CODE nếu chưa có
        if not self.person_code and self.chi and self.generation is not None:
            self.person_code = self._generate_person_code()
        
        super().save(*args, **kwargs)
        
        # SYNC SPOUSE GENERATION: Dâu/rể có cùng đời với vợ/chồng nội tộc
        if self.member_type == 'blood' and self.generation is not None:
            for spouse in self.spouses.filter(member_type='spouse_in'):
                if spouse.generation != self.generation:
                    spouse.generation = self.generation
                    spouse.save(update_fields=['generation'])
    
    def _generate_person_code(self):
        """Tạo mã người: Chi.Đời.STT — VD: 04.05.001"""
        chi_num = self.chi.number if self.chi else 0
        gen_num = self.generation or 0
        prefix = f"{chi_num:02d}.{gen_num:02d}."
        
        existing = FamilyMember.objects.filter(
            person_code__startswith=prefix
        ).order_by('-person_code').values_list('person_code', flat=True).first()
        
        if existing:
            try:
                last_stt = int(existing.split('.')[-1])
                next_stt = last_stt + 1
            except (ValueError, IndexError):
                next_stt = 1
        else:
            next_stt = 1
        
        return f"{prefix}{next_stt:03d}"
    
    def get_absolute_url(self):
        return reverse('core:member_detail', kwargs={'pk': self.pk})
    
    @property
    def children(self):
        """Lấy tất cả con — dùng cho trang chi tiết (phả quan hệ)"""
        return FamilyMember.objects.filter(
            models.Q(father=self) | models.Q(mother=self)
        ).distinct().order_by('birth_order', 'name')

    @property
    def children_in_tree(self):
        """
        Con hiện trong phả tộc (cây chính).
        - Nam: hiện tất cả con (father=self)
        - Nữ Đinh (chồng mất, về đóng góp): KHÔNG hiện con trong cây,
          vì con mang họ chồng, không nối vào phả tộc.
          Con của nữ Đinh chỉ hiện trong phả quan hệ (trang chi tiết).
        """
        if self.gender == 'male':
            return FamilyMember.objects.filter(
                father=self
            ).order_by('birth_order', 'name')
        else:
            # Nữ: không hiện con trong cây phả tộc
            return FamilyMember.objects.none()
    
    @property
    def siblings(self):
        """Lấy anh chị em ruột"""
        if not self.father and not self.mother:
            return FamilyMember.objects.none()
        
        q = models.Q()
        if self.father:
            q |= models.Q(father=self.father)
        if self.mother:
            q |= models.Q(mother=self.mother)
        
        return FamilyMember.objects.filter(q).exclude(pk=self.pk).distinct()
    
    @property
    def is_alive(self):
        return not bool(self.death_date)
    
    def calculate_relation_to(self, other):
        """Tính quan hệ với một thành viên khác dựa trên đời"""
        if not self.generation or not other.generation:
            return "Quan hệ xã hội (không rõ ngôi thứ)"
        
        diff = self.generation - other.generation
        
        relations = {
            0: "Cùng thế hệ (Anh/Chị/Em)",
            1: f"{self.name} là Cháu của {other.name}",
            -1: f"{self.name} là bậc Cha/Chú/Bác của {other.name}",
            2: f"{self.name} là Cháu nội/ngoại của {other.name}",
            -2: f"{self.name} là Ông/Bà của {other.name}",
        }
        
        if diff in relations:
            return relations[diff]
        elif diff > 0:
            return f"{self.name} là cháu đời thứ {diff} của {other.name}"
        else:
            return f"{self.name} là bậc trên {-diff} đời của {other.name}"


class SocialLink(models.Model):
    """
    Mối quan hệ xã hội do user tự thêm (UC06)
    Dùng để lưu: cháu ngoại, con gái đã đi lấy chồng, bạn bè, đối tác...
    Chỉ hiển thị cho owner hoặc khi is_public=True
    """
    LINK_TYPE_CHOICES = [
        # Quan hệ gia đình mở rộng
        ('grandchild_external', 'Cháu ngoại'),          # Con của con gái đã lấy chồng
        ('daughter_married', 'Con gái đã lấy chồng'),   # Con gái đi lấy chồng
        ('adopted_child', 'Con nuôi'),                  # Con nuôi của người trong họ
        ('foster_parent', 'Bố/Mẹ nuôi'),               # Bố mẹ nuôi của người trong họ
        ('step_child', 'Con riêng'),                   # Con riêng của vợ/chồng
        ('in_law', 'Thông gia'),                       # Quan hệ thông gia
        ('naturalized', 'Nhập tịch'),                  # Người từ ngoài vào họ
        # Quan hệ xã hội
        ('friend', 'Bạn bè/Bạn thân'),
        ('partner', 'Đối tác kinh doanh'),
        ('neighbor', 'Hàng xóm/Láng giềng'),
        ('other', 'Quan hệ khác'),
    ]
    
    # Người trong dòng họ (điểm gốc)
    from_member = models.ForeignKey(
        FamilyMember, 
        on_delete=models.CASCADE,
        related_name='social_links_from',
        verbose_name='Từ thành viên'
    )
    
    # Người được liên kết (có thể trong hoặc ngoài dòng họ)
    to_person_name = models.CharField(max_length=100, verbose_name='Tên người liên kết')
    to_person_gender = models.CharField(
        max_length=10, 
        choices=FamilyMember.GENDER_CHOICES,
        default='male',
        verbose_name='Giới tính'
    )
    to_member = models.ForeignKey(
        FamilyMember, 
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='social_links_to',
        verbose_name='Thành viên liên kết (nếu có trong cây)'
    )
    
    # Thông tin mối quan hệ
    link_type = models.CharField(
        max_length=20, 
        choices=LINK_TYPE_CHOICES,
        verbose_name='Loại quan hệ'
    )
    label = models.CharField(max_length=100, blank=True, verbose_name='Nhãn tùy chỉnh')
    seniority_note = models.CharField(
        max_length=50, blank=True, 
        verbose_name='Thứ bậc',
        help_text='Ghi chú thứ bậc so với ego (anh/em/cô/chú...)'
    )
    notes = models.TextField(blank=True, verbose_name='Ghi chú')
    
    # Quyền sở hữu & riêng tư
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE,
        related_name='social_links',
        verbose_name='Chủ sở hữu'
    )
    is_public = models.BooleanField(default=False, verbose_name='Công khai')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Quan hệ xã hội'
        verbose_name_plural = 'Các quan hệ xã hội'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.from_member.name} → {self.to_person_name} ({self.get_link_type_display()})"


class SpouseRelation(models.Model):
    """
    Quan hệ vợ chồng chi tiết
    Dùng để ghi nhận: Bà Cả, Bà Hai... và con của bà nào
    """
    STATUS_CHOICES = [
        ('married', 'Đang hôn phối'),
        ('divorced', 'Đã ly hôn'),
        ('widowed', 'Góa'),
    ]

    husband = models.ForeignKey(
        FamilyMember,
        on_delete=models.CASCADE,
        related_name='wife_relations',
        verbose_name='Chồng (Đinh)',
        limit_choices_to={'gender': 'male', 'is_dinh': True}
    )
    wife = models.ForeignKey(
        FamilyMember,
        on_delete=models.CASCADE,
        related_name='husband_relations',
        verbose_name='Vợ'
    )
    wife_order = models.PositiveIntegerField(
        default=1,
        verbose_name='Thứ tự',
        help_text='1=Bà Cả, 2=Bà Hai, 3=Bà Ba...'
    )
    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='married',
        verbose_name='Tình trạng'
    )
    marriage_date = models.CharField(
        max_length=50, blank=True,
        verbose_name='Ngày cưới'
    )
    notes = models.TextField(blank=True, verbose_name='Ghi chú')
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Quan hệ vợ chồng'
        verbose_name_plural = 'Các quan hệ vợ chồng'
        ordering = ['husband', 'wife_order']
        unique_together = ['husband', 'wife']
    
    def __str__(self):
        order_names = {1: 'Bà Cả', 2: 'Bà Hai', 3: 'Bà Ba', 4: 'Bà Tư'}
        order_display = order_names.get(self.wife_order, f'Bà thứ {self.wife_order}')
        return f"{self.husband.name} - {self.wife.name} ({order_display})"
    
    @property
    def children(self):
        """Lấy con của cặp vợ chồng này"""
        return FamilyMember.objects.filter(
            father=self.husband,
            mother=self.wife
        ).order_by('birth_order', 'name')


# ============================================================================
# GENEALOGY MODELS - Phục vụ cho việc nhập và quản lý gia phả từ Excel
# ============================================================================

class Genealogy(models.Model):
    """Model lưu trữ thông tin gia phả"""
    name = models.CharField(max_length=200, verbose_name='Tên gia phả')
    description = models.TextField(blank=True, verbose_name='Mô tả')
    total_people = models.PositiveIntegerField(default=0, verbose_name='Tổng số người')
    total_generations = models.PositiveIntegerField(default=0, verbose_name='Tổng số thế hệ')
    json_data = models.JSONField(default=dict, blank=True, verbose_name='Dữ liệu JSON')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Gia phả'
        verbose_name_plural = 'Gia phả'

    def __str__(self):
        return self.name


class GenealogyPerson(models.Model):
    """Model lưu trữ thông tin từng người trong gia phả"""
    genealogy = models.ForeignKey(Genealogy, on_delete=models.CASCADE, 
                                 related_name='people', verbose_name='Gia phả')
    person_id = models.CharField(max_length=50, verbose_name='Mã người (ID)')
    name = models.CharField(max_length=200, verbose_name='Họ và tên')
    generation = models.PositiveIntegerField(null=True, blank=True, verbose_name='Thế hệ')
    birth_year = models.IntegerField(null=True, blank=True, verbose_name='Năm sinh')
    location = models.CharField(max_length=200, blank=True, verbose_name='Nơi ở')
    notes = models.TextField(blank=True, verbose_name='Ghi chú')
    father_id = models.CharField(max_length=50, null=True, blank=True, 
                                verbose_name='Mã cha')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Thành viên gia phả'
        verbose_name_plural = 'Thành viên gia phả'
        unique_together = ('genealogy', 'person_id')

    def __str__(self):
        return f"{self.name} ({self.person_id})"


class GenealogySpouse(models.Model):
    """Model lưu trữ thông tin vợ của các thành viên"""
    person = models.ForeignKey(GenealogyPerson, on_delete=models.CASCADE,
                              related_name='spouses', verbose_name='Người chồng')
    name = models.CharField(max_length=200, verbose_name='Tên vợ')
    birth_year = models.IntegerField(null=True, blank=True, verbose_name='Năm sinh')
    order = models.PositiveIntegerField(default=1, verbose_name='Thứ tự')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Vợ'
        verbose_name_plural = 'Vợ'
        ordering = ['person', 'order']

    def __str__(self):
        return f"{self.name} (vợ của {self.person.name})"


class GenealogyRelationship(models.Model):
    """Model lưu trữ quan hệ giữa các thành viên"""
    RELATIONSHIP_TYPE_CHOICES = [
        ('parent', 'Cha/Con'),
        ('spouse', 'Vợ/Chồng'),
        ('sibling', 'Anh/Em'),
    ]

    genealogy = models.ForeignKey(Genealogy, on_delete=models.CASCADE,
                                 related_name='relationships', verbose_name='Gia phả')
    from_person = models.ForeignKey(GenealogyPerson, on_delete=models.CASCADE,
                                   related_name='relationships_from', 
                                   verbose_name='Từ người')
    to_person = models.ForeignKey(GenealogyPerson, on_delete=models.CASCADE,
                                 related_name='relationships_to',
                                 verbose_name='Đến người')
    relationship_type = models.CharField(max_length=20, choices=RELATIONSHIP_TYPE_CHOICES,
                                        verbose_name='Loại quan hệ')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Quan hệ'
        verbose_name_plural = 'Quan hệ'
        unique_together = ('genealogy', 'from_person', 'to_person', 'relationship_type')

    def __str__(self):
        rel_display = dict(self.RELATIONSHIP_TYPE_CHOICES)[self.relationship_type]
        return f"{self.from_person.name} -> {self.to_person.name} ({rel_display})"


# ============================================================================
# DRAFT SUBMISSION MODELS - Hệ thống Tự Khai Gia Phả
# ============================================================================

import uuid


def generate_draft_code():
    return f"DK-{uuid.uuid4().hex[:8]}"


class DraftSubmission(models.Model):
    """Bản khai gia phả do người dân tự điền (không cần đăng nhập)"""
    STATUS_CHOICES = [
        ('draft', 'Đang soạn'),
        ('submitted', 'Đã gửi'),
        ('approved', 'Đã duyệt'),
        ('rejected', 'Từ chối'),
    ]

    draft_code = models.CharField(
        max_length=12, unique=True, default=generate_draft_code,
        verbose_name='Mã bản khai'
    )
    session_key = models.CharField(max_length=40, blank=True, verbose_name='Session ID')
    ip_address = models.GenericIPAddressField(verbose_name='Địa chỉ IP')
    
    # Thông tin người khai
    submitter_name = models.CharField(max_length=100, verbose_name='Họ tên người khai')
    submitter_phone = models.CharField(max_length=20, blank=True, verbose_name='Số điện thoại')
    submitter_relation = models.CharField(
        max_length=200, blank=True,
        verbose_name='Quan hệ với dòng họ',
        help_text='VD: Con trai trưởng, Chi 4, Đời 6'
    )
    notes = models.TextField(blank=True, verbose_name='Ghi chú chung')

    status = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='draft',
        verbose_name='Trạng thái'
    )
    
    # Admin review
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, verbose_name='Người duyệt'
    )
    review_notes = models.TextField(blank=True, verbose_name='Ghi chú duyệt')
    reviewed_at = models.DateTimeField(null=True, blank=True, verbose_name='Ngày duyệt')

    # Layout positions for relationship builder (JSON: {temp_id: {x, y}})
    layout_data = models.JSONField(default=dict, blank=True, verbose_name='Bố cục phả đồ')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Bản khai gia phả'
        verbose_name_plural = 'Các bản khai gia phả'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.draft_code} — {self.submitter_name} ({self.get_status_display()})"

    @property
    def person_count(self):
        return self.persons.count()


class DraftPerson(models.Model):
    """Một người trong bản khai"""
    RELATION_CHOICES = [
        ('self', 'Bản thân người khai'),
        ('father', 'Cha'),
        ('mother', 'Mẹ'),
        ('spouse', 'Vợ/Chồng'),
        ('child', 'Con'),
        ('sibling', 'Anh/Chị/Em'),
        ('grandparent', 'Ông/Bà'),
        ('grandchild', 'Cháu'),
        ('uncle_aunt', 'Chú/Bác/Cô/Dì'),
        ('other', 'Khác'),
    ]
    GENDER_CHOICES = FamilyMember.GENDER_CHOICES
    ACTION_CHOICES = [
        ('pending', 'Chờ xử lý'),
        ('create_new', 'Tạo mới'),
        ('link_existing', 'Liên kết người đã có'),
        ('skip', 'Bỏ qua'),
    ]

    submission = models.ForeignKey(
        DraftSubmission, on_delete=models.CASCADE,
        related_name='persons', verbose_name='Bản khai'
    )
    temp_id = models.PositiveIntegerField(verbose_name='Số TT trong bản khai')

    # Thông tin cá nhân
    name = models.CharField(max_length=100, verbose_name='Họ và tên')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, verbose_name='Giới tính')
    birth_date = models.CharField(max_length=50, blank=True, verbose_name='Ngày sinh')
    death_date = models.CharField(max_length=50, blank=True, verbose_name='Ngày mất (dương lịch)')
    death_date_lunar = models.CharField(max_length=50, blank=True, verbose_name='Ngày mất (âm lịch)')
    is_deceased = models.BooleanField(default=False, verbose_name='Đã mất')
    notes = models.TextField(blank=True, verbose_name='Ghi chú')
    photo = models.ImageField(upload_to='drafts/', null=True, blank=True, verbose_name='Ảnh')
    is_dinh = models.BooleanField(default=False, verbose_name='Tính Đinh',
                                   help_text='Nam giới thuộc dòng trực hệ = Đinh')
    member_type = models.CharField(
        max_length=20, choices=FamilyMember.MEMBER_TYPE_CHOICES,
        default='blood', verbose_name='Loại thành viên',
        help_text='Dòng trực hệ / Dâu-Rể / Con nuôi / Cháu ngoại / Nhập tịch'
    )

    # Quan hệ
    relation_to_submitter = models.CharField(
        max_length=20, choices=RELATION_CHOICES, default='other',
        verbose_name='Quan hệ với người khai'
    )
    father_temp_id = models.PositiveIntegerField(
        null=True, blank=True, verbose_name='Cha (Số TT)'
    )
    mother_temp_id = models.PositiveIntegerField(
        null=True, blank=True, verbose_name='Mẹ (Số TT)'
    )
    birth_order = models.PositiveIntegerField(null=True, blank=True, verbose_name='Con thứ')
    chi_number = models.PositiveIntegerField(null=True, blank=True, verbose_name='Chi số')
    generation = models.PositiveIntegerField(null=True, blank=True, verbose_name='Đời thứ')

    # Admin mapping
    action = models.CharField(
        max_length=15, choices=ACTION_CHOICES, default='pending',
        verbose_name='Hành động khi duyệt'
    )
    linked_member = models.ForeignKey(
        FamilyMember, null=True, blank=True,
        on_delete=models.SET_NULL, verbose_name='Liên kết thành viên'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Người trong bản khai'
        verbose_name_plural = 'Người trong bản khai'
        ordering = ['submission', 'temp_id']
        unique_together = ['submission', 'temp_id']

    def __str__(self):
        return f"#{self.temp_id} {self.name} ({self.get_relation_to_submitter_display()})"

    @property
    def father_name(self):
        if self.father_temp_id:
            p = self.submission.persons.filter(temp_id=self.father_temp_id).first()
            return p.name if p else None
        return None

    @property
    def mother_name(self):
        if self.mother_temp_id:
            p = self.submission.persons.filter(temp_id=self.mother_temp_id).first()
            return p.name if p else None
        return None


class DraftSpouseRelation(models.Model):
    """Quan hệ vợ chồng trong bản khai — hỗ trợ nhiều vợ/chồng"""
    SPOUSE_STATUS_CHOICES = [
        ('married', 'Đang hôn phối'),
        ('divorced', 'Đã ly hôn'),
        ('widowed', 'Góa'),
    ]

    submission = models.ForeignKey(
        DraftSubmission, on_delete=models.CASCADE,
        related_name='spouse_relations', verbose_name='Bản khai'
    )
    person1_temp_id = models.PositiveIntegerField(verbose_name='Người 1 (Số TT)')
    person2_temp_id = models.PositiveIntegerField(verbose_name='Người 2 (Số TT)')
    status = models.CharField(
        max_length=10, choices=SPOUSE_STATUS_CHOICES,
        default='married', verbose_name='Tình trạng'
    )
    wife_order = models.PositiveIntegerField(
        default=1, verbose_name='Thứ tự bà',
        help_text='1=Bà Cả, 2=Bà Hai, 3=Bà Ba...'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Quan hệ vợ chồng (bản khai)'
        verbose_name_plural = 'Các quan hệ vợ chồng (bản khai)'
        unique_together = ['submission', 'person1_temp_id', 'person2_temp_id']

    def __str__(self):
        return f"#{self.person1_temp_id} ↔ #{self.person2_temp_id} ({self.get_status_display()})"

    def save(self, *args, **kwargs):
        # Always store with person1 < person2 to avoid duplicates
        if self.person1_temp_id > self.person2_temp_id:
            self.person1_temp_id, self.person2_temp_id = self.person2_temp_id, self.person1_temp_id
        super().save(*args, **kwargs)
