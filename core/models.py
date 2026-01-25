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
    death_date = models.CharField(max_length=50, blank=True, verbose_name='Ngày mất')
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
        
        # AUTO-SET IS_DINH: Con trai của Đinh → là Đinh
        if self.gender == 'male' and self.member_type in ('blood', 'adopted_in', 'adopted_child'):
            if self.father and self.father.is_dinh:
                self.is_dinh = True
        
        super().save(*args, **kwargs)
        
        # SYNC SPOUSE GENERATION: Dâu/rể có cùng đời với vợ/chồng nội tộc
        if self.member_type == 'blood' and self.generation is not None:
            for spouse in self.spouses.filter(member_type='spouse_in'):
                if spouse.generation != self.generation:
                    spouse.generation = self.generation
                    spouse.save(update_fields=['generation'])
    
    def get_absolute_url(self):
        return reverse('core:member_detail', kwargs={'pk': self.pk})
    
    @property
    def children(self):
        """Lấy tất cả con của thành viên này"""
        return FamilyMember.objects.filter(
            models.Q(father=self) | models.Q(mother=self)
        ).distinct().order_by('birth_order', 'name')
    
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
