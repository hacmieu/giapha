"""
API views for Genealogy
"""
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django.core.files.storage import default_storage
from core.models import Genealogy, GenealogyPerson
from api.genealogy_serializers import (
    GenealogyListSerializer, GenealogyDetailSerializer,
    GenealogyGOJSSerializer, GenealogyPersonSerializer
)
import json
import tempfile
import os


class GenealogyViewSet(viewsets.ModelViewSet):
    """
    API endpoints for Genealogy
    
    list - Get all genealogies
    create - Create new genealogy
    retrieve - Get specific genealogy details
    update - Update genealogy
    destroy - Delete genealogy
    
    Custom actions:
    - upload_excel: Upload and convert Excel file
    - gojs_data: Get data in GoJS format
    - export_json: Export genealogy as JSON
    """
    queryset = Genealogy.objects.all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = (MultiPartParser, FormParser)

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GenealogyDetailSerializer
        elif self.action == 'list':
            return GenealogyListSerializer
        else:
            return GenealogyListSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['post'])
    def upload_excel(self, request):
        """
        Upload Excel file and convert to genealogy
        
        Expected fields:
        - file: Excel file (.xlsx)
        - genealogy_name: Name for the genealogy (optional)
        """
        if 'file' not in request.FILES:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        excel_file = request.FILES['file']
        genealogy_name = request.POST.get('genealogy_name', 'Imported Genealogy')

        # Save file temporarily
        temp_path = tempfile.mktemp(suffix='.xlsx')
        try:
            with open(temp_path, 'wb') as f:
                for chunk in excel_file.chunks():
                    f.write(chunk)

            # Run conversion command
            from django.core.management import call_command
            from io import StringIO

            out = StringIO()
            call_command(
                'convert_genealogy_excel',
                temp_path,
                genealogy_name=genealogy_name,
                stdout=out,
                stderr=out
            )

            # Get the created genealogy
            genealogy = Genealogy.objects.get(name=genealogy_name)
            
            # Generate GoJS JSON
            serializer = GenealogyGOJSSerializer(genealogy)
            genealogy.json_data = serializer.data
            genealogy.save()

            return Response({
                'message': 'Genealogy imported successfully',
                'genealogy': GenealogyListSerializer(genealogy).data,
                'conversion_log': out.getvalue()
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    @action(detail=True, methods=['get'])
    def gojs_data(self, request, pk=None):
        """Get genealogy data in GoJS format"""
        genealogy = self.get_object()
        serializer = GenealogyGOJSSerializer(genealogy)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def export_json(self, request, pk=None):
        """Export genealogy as JSON"""
        genealogy = self.get_object()
        serializer = GenealogyDetailSerializer(genealogy)
        
        # Create response with JSON attachment
        response = Response(
            serializer.data,
            status=status.HTTP_200_OK,
            content_type='application/json'
        )
        response['Content-Disposition'] = f'attachment; filename="{genealogy.name}.json"'
        return response

    @action(detail=True, methods=['get'])
    def preview(self, request, pk=None):
        """Get preview of genealogy (first 50 people)"""
        genealogy = self.get_object()
        people = genealogy.people.all()[:50]
        serializer = GenealogyPersonSerializer(people, many=True)
        return Response({
            'genealogy': GenealogyListSerializer(genealogy).data,
            'preview_people': serializer.data,
            'total_people': genealogy.total_people,
            'showing': len(serializer.data)
        })

    @action(detail=True, methods=['get'])
    def tree_data(self, request, pk=None):
        """
        Get tree data organized by generation for genealogy visualization
        """
        genealogy = self.get_object()
        
        # Organize by generation
        generations = {}
        for person in genealogy.people.all():
            gen = person.generation or 0
            if gen not in generations:
                generations[gen] = []
            
            generations[gen].append({
                'id': person.person_id,
                'name': person.name,
                'birthYear': person.birth_year,
                'location': person.location,
                'spouses': [s.name for s in person.spouses.all()],
                'fatherId': person.father_id
            })
        
        return Response({
            'genealogy': GenealogyListSerializer(genealogy).data,
            'generationTree': generations
        })
