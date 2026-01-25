from django.contrib import admin
from django.utils.html import format_html
from django.utils.safestring import mark_safe
from django.urls import reverse
from .models import Family, Chi, FamilyMember, SocialLink, SpouseRelation


@admin.register(Family)
class FamilyAdmin(admin.ModelAdmin):
    list_display = ['name', 'village', 'chi_count', 'created_at']
    search_fields = ['name', 'village', 'address']


@admin.register(Chi)
class ChiAdmin(admin.ModelAdmin):
    list_display = ['number', 'name', 'family', 'get_member_count', 'get_dinh_count']
    list_filter = ['family']
    ordering = ['number']

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset

    @admin.display(description='Số thành viên')
    def get_member_count(self, obj):
        return obj.get_member_count()

    @admin.display(description='Số Đinh')
    def get_dinh_count(self, obj):
        return obj.get_dinh_count()


@admin.register(FamilyMember)
class FamilyMemberAdmin(admin.ModelAdmin):
    list_display = ['name', 'gender_icon', 'chi', 'generation', 'is_dinh_icon', 
                    'father_link', 'mother_link', 'member_type']
    list_filter = ['chi', 'gender', 'is_dinh', 'member_type']
    search_fields = ['name', 'notes', 'legacy_id']
    ordering = ['chi', 'generation', 'birth_order']
    readonly_fields = ['legacy_id', 'created_at', 'updated_at', 'created_by']
    
    fieldsets = (
        ('Thông tin cơ bản', {
            'fields': ('legacy_id', 'name', 'gender', 'photo')
        }),
        ('Phân loại', {
            'fields': ('chi', 'generation', 'is_dinh', 'member_type')
        }),
        ('Quan hệ gia đình', {
            'fields': ('father', 'mother', 'spouses', 'birth_order')
        }),
        ('Ngày tháng', {
            'fields': ('birth_date', 'death_date')
        }),
        ('Ghi chú', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    filter_horizontal = ['spouses']
    autocomplete_fields = ['father', 'mother']
    
    def gender_icon(self, obj):
        if obj.gender == 'male':
            return mark_safe('<span style="color: blue;">♂</span>')
        return mark_safe('<span style="color: pink;">♀</span>')
    gender_icon.short_description = 'GT'
    
    def is_dinh_icon(self, obj):
        if obj.is_dinh:
            return mark_safe('<span style="color: green;">✓</span>')
        return mark_safe('<span style="color: gray;">-</span>')
    is_dinh_icon.short_description = 'Đinh'
    
    def father_link(self, obj):
        if obj.father:
            url = reverse('admin:core_familymember_change', args=[obj.father.id])
            return format_html('<a href="{}">{}</a>', url, obj.father.name)
        return '-'
    father_link.short_description = 'Cha'
    
    def mother_link(self, obj):
        if obj.mother:
            url = reverse('admin:core_familymember_change', args=[obj.mother.id])
            return format_html('<a href="{}">{}</a>', url, obj.mother.name)
        return '-'
    mother_link.short_description = 'Mẹ'
    
    def save_model(self, request, obj, form, change):
        if not change:  # Creating new object
            obj.created_by = request.user
        super().save_model(request, obj, form, change)



@admin.register(SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    list_display = ['from_member', 'to_person_name', 'link_type', 'label', 'owner', 'is_public', 'created_at']
    list_filter = ['link_type', 'is_public', 'owner']
    search_fields = ['from_member__name', 'to_person_name', 'label', 'notes']
    autocomplete_fields = ['from_member', 'to_member']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Mối quan hệ', {
            'fields': ('from_member', 'to_person_name', 'to_person_gender', 'to_member')
        }),
        ('Loại quan hệ', {
            'fields': ('link_type', 'label', 'seniority_note', 'notes')
        }),
        ('Quyền sở hữu', {
            'fields': ('owner', 'is_public')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.owner = request.user
        super().save_model(request, obj, form, change)


@admin.register(SpouseRelation)
class SpouseRelationAdmin(admin.ModelAdmin):
    list_display = ['husband', 'wife', 'wife_order_display', 'children_count', 'marriage_date', 'created_at']
    list_filter = ['wife_order', 'husband__chi']
    search_fields = ['husband__name', 'wife__name', 'notes']
    autocomplete_fields = ['husband', 'wife']
    readonly_fields = ['created_at', 'updated_at', 'children_list']
    
    fieldsets = (
        ('Quan hệ vợ chồng', {
            'fields': ('husband', 'wife', 'wife_order')
        }),
        ('Thông tin', {
            'fields': ('marriage_date', 'notes')
        }),
        ('Con cái', {
            'fields': ('children_list',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    @admin.display(description='Thứ tự')
    def wife_order_display(self, obj):
        order_names = {1: 'Bà Cả', 2: 'Bà Hai', 3: 'Bà Ba', 4: 'Bà Tư'}
        return order_names.get(obj.wife_order, f'Bà thứ {obj.wife_order}')
    
    @admin.display(description='Số con')
    def children_count(self, obj):
        return obj.children.count()
    
    @admin.display(description='Danh sách con')
    def children_list(self, obj):
        children = obj.children
        if not children.exists():
            return 'Chưa có con'
        links = []
        for child in children:
            url = reverse('admin:core_familymember_change', args=[child.id])
            links.append(format_html('<a href="{}">{}</a>', url, child.name))
        return mark_safe(', '.join(links))
