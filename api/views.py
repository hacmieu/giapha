from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from rest_framework.decorators import action
from django.db.models import Count, Q

from core.models import Family, Chi, FamilyMember, SocialLink, SpouseRelation
from .serializers import (
    ChiSerializer, 
    FamilyMemberListSerializer, 
    FamilyMemberDetailSerializer,
    FamilyMemberWriteSerializer,
    TreeNodeSerializer
)


class IsEditorOrReadOnly(IsAuthenticatedOrReadOnly):
    """Custom permission - chỉ cho phép editor sửa"""
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return request.user.is_authenticated and request.user.can_edit_members()


class ChiViewSet(viewsets.ReadOnlyModelViewSet):
    """API endpoint cho Chi"""
    queryset = Chi.objects.annotate(
        member_count=Count('members'),
        dinh_count=Count('members', filter=Q(members__is_dinh=True))
    )
    serializer_class = ChiSerializer


class FamilyMemberViewSet(viewsets.ModelViewSet):
    """API endpoint cho FamilyMember"""
    queryset = FamilyMember.objects.select_related('chi', 'father', 'mother')
    permission_classes = [IsEditorOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return FamilyMemberListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return FamilyMemberWriteSerializer
        return FamilyMemberDetailSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        
        # Filter by chi
        chi = self.request.query_params.get('chi')
        if chi:
            qs = qs.filter(chi__number=chi)
        
        # Filter by gender
        gender = self.request.query_params.get('gender')
        if gender:
            qs = qs.filter(gender=gender)
        
        # Filter dinh only
        dinh = self.request.query_params.get('dinh')
        if dinh == 'true':
            qs = qs.filter(is_dinh=True)
        
        # Search
        search = self.request.query_params.get('q')
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(notes__icontains=search))
        
        return qs
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['get'])
    def family(self, request, pk=None):
        """Lấy thông tin gia đình của một thành viên"""
        member = self.get_object()
        return Response({
            'member': FamilyMemberDetailSerializer(member).data,
            'father': FamilyMemberListSerializer(member.father).data if member.father else None,
            'mother': FamilyMemberListSerializer(member.mother).data if member.mother else None,
            'spouses': FamilyMemberListSerializer(member.spouses.all(), many=True).data,
            'children': FamilyMemberListSerializer(member.children, many=True).data,
            'siblings': FamilyMemberListSerializer(member.siblings, many=True).data,
        })


class StatsView(APIView):
    """API endpoint cho thống kê"""
    def get(self, request):
        family = Family.objects.first()
        chi_stats = Chi.objects.annotate(
            member_count=Count('members'),
            dinh_count=Count('members', filter=Q(members__is_dinh=True))
        ).values('number', 'name', 'member_count', 'dinh_count')
        
        return Response({
            'family': {
                'name': family.name if family else 'Họ Vũ',
                'village': family.village if family else '',
                'address': family.address if family else '',
            },
            'total_members': FamilyMember.objects.count(),
            'total_dinh': FamilyMember.objects.filter(is_dinh=True).count(),
            'chi_stats': list(chi_stats),
        })


class TreeDataView(APIView):
    """API endpoint cho dữ liệu phả đồ"""
    def get(self, request, chi_number):
        if chi_number == 0:
            # Thủy tổ và các trưởng chi
            members = FamilyMember.objects.filter(
                Q(chi__isnull=True) | Q(generation=1)
            )
        else:
            members = FamilyMember.objects.filter(chi__number=chi_number)
        
        return Response({
            'chi_number': chi_number,
            'members': TreeNodeSerializer(members, many=True).data
        })


class GraphDataView(APIView):
    """API Endpoint phục vụ dữ liệu cho GoJS Genogram"""
    
    def get(self, request):
        nodes = []
        links = []
        
        # Check if full view or dinh-only (default: dinh-only for demo)
        full_view = request.query_params.get('full', '0') == '1'
        chi_filter = request.query_params.get('chi')
        
        # 1. Fetch members based on view mode
        members = FamilyMember.objects.filter(
            Q(is_public=True) | Q(created_by=request.user if request.user.is_authenticated else None)
        ).select_related('father', 'mother', 'chi').prefetch_related('spouses')
        
        if not full_view:
            # Đinh-only mode: Đinh + con gái của Đinh + vợ của Đinh
            members = members.filter(
                Q(is_dinh=True) |
                Q(gender='female', father__is_dinh=True) |
                Q(gender='female', spouses__is_dinh=True)
            ).distinct()
        
        if chi_filter:
            # Inclusive filtering: Include people in the chi, AND their children/spouses 
            # (especially for blood daughters whose children/husband aren't assigned a Chi)
            members = members.filter(
                Q(chi__number=chi_filter) |
                Q(father__chi__number=chi_filter) |
                Q(mother__chi__number=chi_filter) |
                Q(spouses__chi__number=chi_filter)
            ).distinct()
        
        for m in members:
            # Create Node
            node = {
                "key": m.id,
                "n": m.name,
                "s": m.gender,
                "m": m.mother_id,
                "f": m.father_id,
                "ux": [s.id for s in m.spouses.all()],
                "vir": [s.id for s in m.spouses.all()],
                "spouses_data": [{"name": s.name} for s in m.spouses.all()], # Add spouse names
                "photo": m.photo.url if m.photo else "", # Add photo URL
                "a": m.attributes,
                "gen": m.generation,
                "chi": m.chi.name if m.chi else "",
                "is_dinh": m.is_dinh,
                "member_type": m.member_type,  # UC03: for visual distinction
                "birth_order": m.birth_order,
                "deceased": m.is_deceased or bool(m.death_date),
            }
            nodes.append(node)
        
        # 2. Fetch SocialLinks (UC06) - only owner's or public (only in full view)
        if full_view:
            if request.user.is_authenticated:
                social_links = SocialLink.objects.filter(
                    Q(is_public=True) | Q(owner=request.user)
                ).select_related('from_member', 'to_member')
            else:
                social_links = SocialLink.objects.filter(is_public=True).select_related('from_member', 'to_member')
        else:
            social_links = SocialLink.objects.none()
        
        social_node_ids = set()
        for sl in social_links:
            # Add social person as node if not already in tree
            if sl.to_member:
                to_key = sl.to_member.id
            else:
                # Create a virtual node for external person
                to_key = f"social_{sl.id}"
                if to_key not in social_node_ids:
                    nodes.append({
                        "key": to_key,
                        "n": sl.to_person_name,
                        "s": sl.to_person_gender,
                        "is_social": True,  # Flag for different styling
                        "link_type": sl.link_type,
                    })
                    social_node_ids.add(to_key)
            
            # Create link
            links.append({
                "from": sl.from_member.id,
                "to": to_key,
                "category": "social",  # For GoJS link template selection
                "text": sl.label or sl.get_link_type_display(),
                "link_type": sl.link_type,
            })
        
        return Response({
            "class": "GraphLinksModel",
            "nodeDataArray": nodes,
            "linkDataArray": links,
            "view_mode": "full" if full_view else "dinh_only"
        })


class RelationshipDataView(APIView):
    """
    API Endpoint cho bảng quan hệ chi tiết
    Trả về: SpouseRelation (vợ/chồng) + SocialLink (quan hệ xã hội)
    """
    
    def get(self, request):
        # 1. Lấy tất cả SpouseRelation
        spouse_relations = SpouseRelation.objects.select_related(
            'husband', 'wife', 'husband__chi'
        ).prefetch_related('husband__children_from_father')
        
        spouse_data = []
        for sr in spouse_relations:
            children = sr.children
            spouse_data.append({
                'id': sr.id,
                'husband': {
                    'id': sr.husband.id,
                    'name': sr.husband.name,
                    'chi': sr.husband.chi.number if sr.husband.chi else None,
                    'generation': sr.husband.generation,
                },
                'wife': {
                    'id': sr.wife.id,
                    'name': sr.wife.name,
                },
                'wife_order': sr.wife_order,
                'wife_order_display': {1: 'Bà Cả', 2: 'Bà Hai', 3: 'Bà Ba', 4: 'Bà Tư'}.get(sr.wife_order, f'Bà thứ {sr.wife_order}'),
                'marriage_date': sr.marriage_date,
                'children': [
                    {'id': c.id, 'name': c.name, 'gender': c.gender, 'is_dinh': c.is_dinh}
                    for c in children
                ],
                'notes': sr.notes,
            })
        
        # 2. Lấy SocialLink (public hoặc của user)
        if request.user.is_authenticated:
            social_links = SocialLink.objects.filter(
                Q(is_public=True) | Q(owner=request.user)
            ).select_related('from_member', 'to_member')
        else:
            social_links = SocialLink.objects.filter(is_public=True).select_related('from_member', 'to_member')
        
        social_data = []
        for sl in social_links:
            social_data.append({
                'id': sl.id,
                'from_member': {
                    'id': sl.from_member.id,
                    'name': sl.from_member.name,
                },
                'to_person_name': sl.to_person_name,
                'to_person_gender': sl.to_person_gender,
                'to_member': {
                    'id': sl.to_member.id,
                    'name': sl.to_member.name,
                } if sl.to_member else None,
                'link_type': sl.link_type,
                'link_type_display': sl.get_link_type_display(),
                'label': sl.label,
                'seniority_note': sl.seniority_note,
                'notes': sl.notes,
                'is_public': sl.is_public,
            })
        
        return Response({
            'spouse_relations': spouse_data,
            'social_links': social_data,
        })
