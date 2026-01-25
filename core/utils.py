"""
Utility functions for genealogy calculations
Các hàm tính toán vai vế, ngôi thứ trong gia phả
"""


def calculate_relationship(node_a, node_b):
    """
    Calculate relationship between two members based on generation difference.
    Tính quan hệ giữa 2 người dựa trên chênh lệch đời.
    
    Returns: (relation_text, can_address)
    """
    # Handle object or dict input
    gen_a = getattr(node_a, 'generation', None) or node_a.get('generation') if isinstance(node_a, dict) else node_a.generation
    gen_b = getattr(node_b, 'generation', None) or node_b.get('generation') if isinstance(node_b, dict) else node_b.generation
    
    name_a = getattr(node_a, 'name', None) or node_a.get('name', 'Người A') if isinstance(node_a, dict) else node_a.name
    name_b = getattr(node_b, 'name', None) or node_b.get('name', 'Người B') if isinstance(node_b, dict) else node_b.name

    if gen_a is None or gen_b is None:
        return "Quan hệ xã hội / Không rõ ngôi thứ", False
        
    diff = gen_a - gen_b
    
    if diff == 0:
        return "Cùng thế hệ (Anh/Chị/Em họ)", True
    elif diff == -1:
        return f"{name_a} là bậc Cha/Chú/Bác/Cô của {name_b}", True
    elif diff == 1:
        return f"{name_a} là bậc Cháu của {name_b}", True
    elif diff == -2:
        return f"{name_a} là bậc Ông/Bà của {name_b}", True
    elif diff == 2:
        return f"{name_a} là bậc Cháu (nội/ngoại) của {name_b}", True
    elif diff == -3:
        return f"{name_a} là bậc Cụ của {name_b}", True
    elif diff == 3:
        return f"{name_a} là bậc Chắt của {name_b}", True
    elif diff < -3:
        return f"{name_a} là bậc Kỵ ({abs(diff)} đời trên) {name_b}", True
    elif diff > 3:
        return f"{name_a} là bậc Chút ({diff} đời dưới) {name_b}", True
    
    return "Quan hệ họ hàng", True


def calculate_seniority(person_a, person_b):
    """
    Calculate detailed seniority for same-generation people.
    Tính xưng hô Anh/Em chi tiết cho người cùng đời.
    
    Logic thứ tự:
    1. So sánh birth_order của CHA (con bác lớn hơn con chú)
    2. Nếu cùng cha: so sánh birth_order của chính người đó
    3. Nếu không có birth_order: so sánh birth_date
    4. Fallback: so sánh ID
    """
    # Get generation first
    gen_a = getattr(person_a, 'generation', None)
    gen_b = getattr(person_b, 'generation', None)
    
    if gen_a != gen_b or gen_a is None:
        return None, "Khác đời - không xếp thứ tự anh em"
    
    name_a = person_a.name
    name_b = person_b.name
    
    # Same father? Compare directly
    if person_a.father_id and person_a.father_id == person_b.father_id:
        order_a = person_a.birth_order or 999
        order_b = person_b.birth_order or 999
        if order_a < order_b:
            return 'senior', f"{name_a} là Anh/Chị của {name_b} (cùng cha)"
        elif order_a > order_b:
            return 'junior', f"{name_a} là Em của {name_b} (cùng cha)"
        else:
            return 'equal', f"{name_a} và {name_b} cùng thứ bậc"
    
    # Different fathers? Compare father's birth_order
    father_a = person_a.father
    father_b = person_b.father
    
    if father_a and father_b:
        # Same grandfather? Compare father's birth_order
        if father_a.father_id and father_a.father_id == father_b.father_id:
            order_fa = father_a.birth_order or 999
            order_fb = father_b.birth_order or 999
            if order_fa < order_fb:
                return 'senior', f"{name_a} là Anh/Chị của {name_b} (con Bác)"
            elif order_fa > order_fb:
                return 'junior', f"{name_a} là Em của {name_b} (con Chú)"
            else:
                # Same father order, compare person's order
                order_a = person_a.birth_order or 999
                order_b = person_b.birth_order or 999
                if order_a < order_b:
                    return 'senior', f"{name_a} là Anh/Chị của {name_b}"
                else:
                    return 'junior', f"{name_a} là Em của {name_b}"
    
    # Fallback: use ID (earlier ID = likely older)
    if hasattr(person_a, 'id') and hasattr(person_b, 'id'):
        if person_a.id < person_b.id:
            return 'senior', f"{name_a} có thể là Anh/Chị của {name_b} (theo thứ tự ghi)"
        else:
            return 'junior', f"{name_a} có thể là Em của {name_b} (theo thứ tự ghi)"
    
    return 'unknown', f"Không xác định được thứ tự giữa {name_a} và {name_b}"


def get_addressing_title(from_person, to_person):
    """
    Get proper Vietnamese addressing title from one person to another.
    Trả về cách xưng hô đúng từ người A với người B.
    
    Example: get_addressing_title(cháu, ông) -> "Ông"
    """
    gen_from = getattr(from_person, 'generation', None)
    gen_to = getattr(to_person, 'generation', None)
    gender_to = getattr(to_person, 'gender', 'male')
    
    if gen_from is None or gen_to is None:
        return "Anh/Chị" if gender_to == 'male' else "Chị/Anh"
    
    diff = gen_from - gen_to  # Positive = I'm younger
    
    titles = {
        # diff: (male_title, female_title)
        0: ("Anh", "Chị"),      # Same generation - need seniority check
        1: ("Chú/Bác", "Cô/Dì"),  # They're 1 gen above
        2: ("Ông", "Bà"),       # 2 gen above
        3: ("Cụ", "Cụ"),        # 3 gen above
        -1: ("Cháu", "Cháu"),   # They're 1 gen below
        -2: ("Cháu", "Cháu"),   # 2 gen below
        -3: ("Chắt", "Chắt"),   # 3 gen below
    }
    
    if diff in titles:
        male_t, female_t = titles[diff]
        return male_t if gender_to == 'male' else female_t
    elif diff > 3:
        return "Cụ/Kỵ"
    elif diff < -3:
        return "Chút/Chít"
    
    return "Họ hàng"
