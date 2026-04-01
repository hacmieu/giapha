from rest_framework import serializers
from core.models import Genealogy, GenealogyPerson, GenealogySpouse, GenealogyRelationship


class GenealogySpouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = GenealogySpouse
        fields = ['id', 'name', 'birth_year', 'order']


class GenealogyPersonSerializer(serializers.ModelSerializer):
    spouses = GenealogySpouseSerializer(many=True, read_only=True)

    class Meta:
        model = GenealogyPerson
        fields = ['id', 'person_id', 'name', 'generation', 'birth_year', 
                  'location', 'notes', 'father_id', 'spouses']


class GenealogyRelationshipSerializer(serializers.ModelSerializer):
    from_person_name = serializers.CharField(source='from_person.name', read_only=True)
    to_person_name = serializers.CharField(source='to_person.name', read_only=True)

    class Meta:
        model = GenealogyRelationship
        fields = ['id', 'from_person', 'to_person', 'from_person_name', 
                  'to_person_name', 'relationship_type']


class GenealogyDetailSerializer(serializers.ModelSerializer):
    people = GenealogyPersonSerializer(many=True, read_only=True)
    relationships = GenealogyRelationshipSerializer(many=True, read_only=True)

    class Meta:
        model = Genealogy
        fields = ['id', 'name', 'description', 'total_people', 'total_generations',
                  'json_data', 'people', 'relationships', 'created_at', 'updated_at']


class GenealogyListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Genealogy
        fields = ['id', 'name', 'description', 'total_people', 'total_generations',
                  'created_at', 'updated_at']


class GenealogyGOJSSerializer(serializers.Serializer):
    """Serializer để convert dữ liệu Genealogy sang định dạng GoJS"""
    def to_representation(self, instance):
        genealogy = instance

        # Lấy tất cả person_id hợp lệ để lọc fatherId
        all_ids = set(genealogy.people.values_list('person_id', flat=True))

        # Tạo node array
        nodeDataArray = []
        for person in genealogy.people.all():
            spouse_names = ', '.join([s.name for s in person.spouses.all()])
            # Chỉ gán fatherId nếu cha tồn tại trong dataset (tránh GoJS lỗi orphan)
            father_id = person.father_id if person.father_id in all_ids else None

            node = {
                'key': person.person_id,
                'name': person.name,
                'generation': person.generation or 0,
                'location': person.location or '',
                'spouses': spouse_names,
                'notes': person.notes or '',
                'birthYear': person.birth_year,
                'fatherId': father_id
            }
            nodeDataArray.append(node)

        # Tạo link array
        linkDataArray = []
        for rel in genealogy.relationships.all():
            link = {
                'from': rel.from_person.person_id,
                'to': rel.to_person.person_id,
                'category': rel.relationship_type
            }
            linkDataArray.append(link)
        
        return {
            'nodeDataArray': nodeDataArray,
            'linkDataArray': linkDataArray,
            'metadata': {
                'totalPeople': genealogy.total_people,
                'totalRelationships': genealogy.relationships.count(),
                'generationRange': [4, 12],
                'lastUpdated': genealogy.updated_at.isoformat()
            }
        }
