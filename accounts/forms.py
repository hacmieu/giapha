from django import forms
from django.contrib.auth.forms import UserCreationForm
from .models import User


class UserRegistrationForm(UserCreationForm):
    """Form đăng ký tài khoản"""
    email = forms.EmailField(required=True, label='Email')
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2', 'first_name', 'last_name', 'phone']
        labels = {
            'username': 'Tên đăng nhập',
            'first_name': 'Tên',
            'last_name': 'Họ',
            'phone': 'Số điện thoại',
        }
    
    def save(self, commit=True):
        user = super().save(commit=False)
        user.role = 'guest'  # Default role for new users
        if commit:
            user.save()
        return user


class UserProfileForm(forms.ModelForm):
    """Form cập nhật profile"""
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'phone']
        labels = {
            'first_name': 'Tên',
            'last_name': 'Họ',
            'email': 'Email',
            'phone': 'Số điện thoại',
        }
