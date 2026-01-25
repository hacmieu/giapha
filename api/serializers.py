from rest_framework import serializers
from core.models import Family, Chi, FamilyMember


class FamilySerializer(serializers.ModelSerializer):
    class Meta:
        model = Family
        fields = '__all__'


class ChiSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    dinh_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = Chi
        fields = ['id', 'number', 'name', 'description', 'member_count', 'dinh_count']


class FamilyMemberListSerializer(serializers.ModelSerializer):
    """Serializer cho danh sách - nhẹ hơn"""
    chi_number = serializers.IntegerField(source='chi.number', read_only=True)
    
    class Meta:
        model = FamilyMember
        fields = ['id', 'legacy_id', 'name', 'gender', 'chi_number', 'generation', 
                  'is_dinh', 'member_type', 'birth_date', 'death_date']


class FamilyMemberDetailSerializer(serializers.ModelSerializer):
    """Serializer cho chi tiết - đầy đủ quan hệ"""
    chi = ChiSerializer(read_only=True)
    chi_name = serializers.SerializerMethodField()
    father = FamilyMemberListSerializer(read_only=True)
    father_name = serializers.CharField(source='father.name', read_only=True, default=None)
    mother = FamilyMemberListSerializer(read_only=True)
    mother_name = serializers.CharField(source='mother.name', read_only=True, default=None)
    spouses = FamilyMemberListSerializer(many=True, read_only=True)
    spouse_names = serializers.SerializerMethodField()
    children = FamilyMemberListSerializer(many=True, read_only=True)
    children_names = serializers.SerializerMethodField()
    siblings = FamilyMemberListSerializer(many=True, read_only=True)
    member_type_display = serializers.CharField(source='get_member_type_display', read_only=True)
    
    class Meta:
        model = FamilyMember
        fields = ['id', 'legacy_id', 'name', 'gender', 'chi', 'chi_name', 'generation', 
                  'is_dinh', 'member_type', 'member_type_display', 'birth_order', 
                  'birth_date', 'death_date', 'notes', 'photo', 
                  'father', 'father_name', 'mother', 'mother_name', 
                  'spouses', 'spouse_names', 'children', 'children_names', 'siblings',
                  'created_at', 'updated_at']
    
    def get_chi_name(self, obj):
        return f"Chi {obj.chi.number}" if obj.chi else None
    
    def get_spouse_names(self, obj):
        return [s.name for s in obj.spouses.all()]
    
    def get_children_names(self, obj):
        # Sort by birth_order, then by name
        children = sorted(obj.children, key=lambda c: (c.birth_order or 999, c.name))
        return [{'id': c.id, 'name': c.name, 'gender': c.gender, 'birth_order': c.birth_order} for c in children]


class FamilyMemberWriteSerializer(serializers.ModelSerializer):
    """Serializer cho tạo/sửa"""
    class Meta:
        model = FamilyMember
        fields = ['name', 'gender', 'chi', 'generation', 'is_dinh', 'member_type',
                  'father', 'mother', 'birth_order', 'birth_date', 'death_date', 'notes', 'photo']
    
    def create(self, validated_data):
        # Auto-generate legacy_id
        last = FamilyMember.objects.order_by('-id').first()
        new_id = (last.id + 1) if last else 1
        validated_data['legacy_id'] = str(new_id)
        return super().create(validated_data)


class TreeNodeSerializer(serializers.ModelSerializer):
    """Serializer cho node trong cây phả đồ"""
    children_ids = serializers.SerializerMethodField()
    spouse_ids = serializers.SerializerMethodField()
    
    class Meta:
        model = FamilyMember
        fields = ['id', 'name', 'gender', 'generation', 'is_dinh', 
                  'father_id', 'mother_id', 'children_ids', 'spouse_ids']
    
    def get_children_ids(self, obj):
        return list(obj.children.values_list('id', flat=True))
    
    def get_spouse_ids(self, obj):
        return list(obj.spouses.values_list('id', flat=True))
