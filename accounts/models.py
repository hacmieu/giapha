from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom User model với phân quyền"""
    ROLE_CHOICES = [
        ('admin', 'Trưởng tộc'),
        ('editor', 'Biên tập viên'),
        ('member', 'Thành viên'),
        ('guest', 'Khách'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='guest')
    linked_member = models.OneToOneField(
        'core.FamilyMember', 
        null=True, blank=True, 
        on_delete=models.SET_NULL,
        related_name='user_account'
    )
    phone = models.CharField(max_length=20, blank=True)
    
    class Meta:
        verbose_name = 'Người dùng'
        verbose_name_plural = 'Người dùng'
    
    def is_admin(self):
        return self.role == 'admin' or self.is_superuser
    
    def is_editor(self):
        return self.role in ['admin', 'editor'] or self.is_superuser
    
    def can_edit_members(self):
        return self.is_editor()
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
