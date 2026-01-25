"""
Import family data from JSON file to database
Usage: python manage.py import_json /path/to/ho-vu-lang-chuong.json
"""
import json
from django.core.management.base import BaseCommand, CommandError
from core.models import Family, Chi, FamilyMember


class Command(BaseCommand):
    help = 'Import family data from JSON file'
    
    def add_arguments(self, parser):
        parser.add_argument('json_file', type=str, help='Path to JSON file')
        parser.add_argument(
            '--clear', 
            action='store_true', 
            help='Clear existing data before import'
        )
    
    def handle(self, *args, **options):
        json_file = options['json_file']
        
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            raise CommandError(f'File not found: {json_file}')
        except json.JSONDecodeError as e:
            raise CommandError(f'Invalid JSON: {e}')
        
        # Clear existing data if requested
        if options['clear']:
            self.stdout.write('Clearing existing data...')
            FamilyMember.objects.all().delete()
            Chi.objects.all().delete()
            Family.objects.all().delete()
        
        # Create Family
        self.stdout.write('Creating family...')
        family, created = Family.objects.get_or_create(
            name=data.get('familyName', 'Họ Vũ'),
            defaults={
                'village': data.get('village', 'Làng Chuông'),
                'address': data.get('address', 'Xã Tân An, TP Hải Phòng'),
                'chi_count': data.get('chiCount', 8)
            }
        )
        
        # Create Chi objects
        self.stdout.write('Creating Chi objects...')
        chi_map = {}
        for i in range(1, 9):
            chi, _ = Chi.objects.get_or_create(
                family=family, 
                number=i,
                defaults={'name': f'Chi {i}'}
            )
            chi_map[i] = chi
        
        # First pass: Create all members
        self.stdout.write('Creating members (first pass)...')
        member_map = {}
        members_data = data.get('members', [])
        
        for m in members_data:
            member_id = m.get('id')
            if not member_id:
                continue
            
            chi_so = m.get('chiSo', 0)
            chi = chi_map.get(chi_so) if chi_so and chi_so > 0 else None
            
            member, created = FamilyMember.objects.get_or_create(
                legacy_id=member_id,
                defaults={
                    'name': m.get('name', 'Unknown'),
                    'gender': m.get('gender', 'male'),
                    'chi': chi,
                    'is_dinh': m.get('isDinh', False),
                    'member_type': m.get('memberType', 'blood'),
                    'birth_order': m.get('birthOrder'),
                    'birth_date': m.get('birthDate') or '',
                    'death_date': m.get('deathDate') or '',
                    'notes': m.get('notes') or '',
                }
            )
            member_map[member_id] = member
        
        self.stdout.write(f'Created {len(member_map)} members')
        
        # Second pass: Set relationships
        self.stdout.write('Setting relationships (second pass)...')
        relationship_count = 0
        
        for m in members_data:
            member_id = m.get('id')
            if not member_id or member_id not in member_map:
                continue
            
            member = member_map[member_id]
            changed = False
            
            # Set father
            father_id = m.get('fatherId')
            if father_id and father_id in member_map:
                member.father = member_map[father_id]
                changed = True
                relationship_count += 1
            
            # Set mother
            mother_id = m.get('motherId')
            if mother_id and mother_id in member_map:
                member.mother = member_map[mother_id]
                changed = True
                relationship_count += 1
            
            # Calculate generation from parents
            if member.father and member.father.generation:
                member.generation = member.father.generation + 1
            elif member.mother and member.mother.generation:
                member.generation = member.mother.generation + 1
            elif not member.father and not member.mother:
                # Root members (Thủy Tổ)
                if member.chi:
                    member.generation = 1  # Chi heads are generation 1
                else:
                    member.generation = 0  # Thủy Tổ
            
            if changed or member.generation:
                member.save()
            
            # Set spouses (M2M)
            spouse_ids = m.get('spouseIds', [])
            for spouse_id in spouse_ids:
                if spouse_id and spouse_id in member_map:
                    spouse = member_map[spouse_id]
                    member.spouses.add(spouse)
                    relationship_count += 1
        
        self.stdout.write(f'Set {relationship_count} relationships')
        
        # Third pass: Calculate generations recursively
        self.stdout.write('Calculating generations...')
        self._calculate_generations()
        
        # Summary
        total_members = FamilyMember.objects.count()
        total_dinh = FamilyMember.objects.filter(is_dinh=True).count()
        
        self.stdout.write(self.style.SUCCESS(
            f'\nImport completed successfully!\n'
            f'  Family: {family.name}\n'
            f'  Total members: {total_members}\n'
            f'  Total Đinh: {total_dinh}\n'
            f'  Chi: 8'
        ))
    
    def _calculate_generations(self):
        """Recursively calculate generations from root members"""
        # Start from members without parents (roots)
        roots = FamilyMember.objects.filter(father__isnull=True, mother__isnull=True)
        
        for root in roots:
            if not root.generation:
                root.generation = 1 if root.chi else 0
                root.save()
            self._set_children_generation(root)
    
    def _set_children_generation(self, parent):
        """Set generation for all children of a member"""
        if not parent.generation:
            return
        
        children = FamilyMember.objects.filter(father=parent) | FamilyMember.objects.filter(mother=parent)
        
        for child in children.distinct():
            if not child.generation:
                child.generation = parent.generation + 1
                child.save()
                self._set_children_generation(child)
