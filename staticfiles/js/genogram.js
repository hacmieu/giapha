// GoJS Genogram implementation with UC03 (Nhập tịch) and UC06 (Social Links)
// Features: LayeredDigraphLayout, generation badges, relationship calculation, social links

let myDiagram;

function init() {
    const $ = go.GraphObject.make;

    myDiagram = $(go.Diagram, "myDiagramDiv", {
        "undoManager.isEnabled": true,
        layout: $(go.LayeredDigraphLayout, { direction: 90, layerSpacing: 50 }),
        "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
        initialAutoScale: go.Diagram.Uniform
    });

    // NODE TEMPLATE - Family Members
    myDiagram.nodeTemplate =
        $(go.Node, "Auto",
            {
                selectionAdorned: true,
                selectionAdornmentTemplate:
                    $(go.Adornment, "Auto",
                        $(go.Shape, "RoundedRectangle", { fill: null, stroke: "#d50000", strokeWidth: 3 }),
                        $(go.Placeholder)
                    ),
                doubleClick: (e, node) => {
                    const key = node.data.key;
                    // Only navigate if it's a real member (integer key)
                    if (key && typeof key === 'number') {
                        window.location.href = `/member/${key}/`;
                    }
                }
            },
            $(go.Shape, "RoundedRectangle",
                { strokeWidth: 2, portId: "", fromLinkable: true, toLinkable: true },
                new go.Binding("fill", "", data => {
                    // Social nodes (external persons)
                    if (data.is_social) return "#fff8e1"; // Amber tint

                    // Color based on gender
                    if (data.s === 'male') return "#e3f2fd";
                    if (data.s === 'female') return "#fce4ec";
                    return "#f5f5f5";
                }),
                new go.Binding("stroke", "", data => {
                    // Social nodes
                    if (data.is_social) return "#ff9800";

                    // Adopted/Nhập tịch (UC03)
                    if (data.member_type === 'adopted_in' || data.member_type === 'adopted_child') {
                        return "#9c27b0"; // Purple for adopted
                    }

                    if (data.is_dinh) return "#00796b";
                    if (data.s === 'male') return "#1565c0";
                    if (data.s === 'female') return "#c2185b";
                    return "#9e9e9e";
                }),
                new go.Binding("strokeWidth", "", data => {
                    if (data.is_dinh) return 3;
                    if (data.is_social) return 2;
                    return 1.5;
                }),
                new go.Binding("strokeDashArray", "", data => {
                    // Dashed border for adopted/nhập tịch (UC03)
                    if (data.member_type === 'adopted_in' || data.member_type === 'adopted_child') {
                        return [4, 2];
                    }
                    // Dashed for social nodes
                    if (data.is_social) return [3, 3];
                    return null;
                })
            ),

            $(go.Panel, "Vertical",
                { margin: 8 },

                // Badge: Nhập tịch / Con nuôi (UC03)
                $(go.Panel, "Auto",
                    { visible: false, margin: new go.Margin(0, 0, 4, 0) },
                    new go.Binding("visible", "member_type", t => t === 'adopted_in' || t === 'adopted_child'),
                    $(go.Shape, "RoundedRectangle", { fill: "#9c27b0", stroke: null }),
                    $(go.TextBlock,
                        { font: "9px sans-serif", stroke: "white", margin: 2 },
                        new go.Binding("text", "member_type", t => t === 'adopted_in' ? '🔗 Nhập tịch' : '👶 Con nuôi'))
                ),

                // Badge: Social relationship type (UC06)
                $(go.Panel, "Auto",
                    { visible: false, margin: new go.Margin(0, 0, 4, 0) },
                    new go.Binding("visible", "is_social"),
                    $(go.Shape, "RoundedRectangle", { fill: "#ff9800", stroke: null }),
                    $(go.TextBlock,
                        { font: "9px sans-serif", stroke: "white", margin: 2 },
                        new go.Binding("text", "link_type", t => {
                            const labels = {
                                'blood_out': '👨‍👩‍👧 Cháu ngoại',
                                'adopted': '👶 Con nuôi',
                                'friend': '🤝 Bạn',
                                'partner': '💼 Đối tác',
                                'other': '🔗 Khác'
                            };
                            return labels[t] || '🔗 Xã hội';
                        }))
                ),

                // Badge thế hệ (Generation badge)
                $(go.Panel, "Auto",
                    { visible: false, margin: new go.Margin(0, 0, 4, 0) },
                    new go.Binding("visible", "gen", g => !!g && g > 0),
                    $(go.Shape, "RoundedRectangle", { fill: "#333", stroke: null }),
                    $(go.TextBlock,
                        { font: "10px sans-serif", stroke: "white", margin: 2 },
                        new go.Binding("text", "gen", g => "Đời " + g))
                ),

                // Chi badge
                $(go.Panel, "Auto",
                    { visible: false, margin: new go.Margin(0, 0, 2, 0) },
                    new go.Binding("visible", "chi", c => !!c),
                    $(go.Shape, "RoundedRectangle", { fill: "#78350f", stroke: null }),
                    $(go.TextBlock,
                        { font: "9px sans-serif", stroke: "white", margin: 2 },
                        new go.Binding("text", "chi"))
                ),

                // Name
                $(go.TextBlock,
                    { font: "bold 11pt sans-serif", stroke: "#333" },
                    new go.Binding("text", "n")),

                // Gender icon
                $(go.TextBlock,
                    { font: "9pt sans-serif", stroke: "#666" },
                    new go.Binding("text", "s", s => s === 'male' ? '♂ Nam' : '♀ Nữ'))
            )
        );

    // LINK TEMPLATE - Default (Parent-child)
    myDiagram.linkTemplate =
        $(go.Link,
            { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver, corner: 5 },
            $(go.Shape, { strokeWidth: 2, stroke: "#555" }),
            $(go.Shape, { toArrow: "Standard", scale: 0.8, fill: "#555" })
        );

    // LINK TEMPLATE - Social Links (UC06)
    myDiagram.linkTemplateMap.add("social",
        $(go.Link,
            { routing: go.Link.AvoidsNodes, curve: go.Link.JumpOver, corner: 5 },
            $(go.Shape,
                { strokeWidth: 2, stroke: "#ff9800", strokeDashArray: [5, 3] }
            ),
            $(go.Shape, { toArrow: "Standard", scale: 0.8, fill: "#ff9800" }),
            // Label panel
            $(go.Panel, "Auto",
                { segmentIndex: 0, segmentFraction: 0.5 },
                $(go.Shape, "RoundedRectangle", { fill: "white", stroke: "#ff9800" }),
                $(go.TextBlock,
                    { margin: 3, font: "9pt sans-serif", stroke: "#e65100" },
                    new go.Binding("text", "text"))
            )
        )
    );

    loadData();
}

function loadData() {
    fetch('/api/graph/')
        .then(response => response.json())
        .then(data => {
            const nodes = data.nodeDataArray || [];
            const apiLinks = data.linkDataArray || [];
            const links = [...apiLinks]; // Start with API-provided links (social links)

            // Build parent-child links from node references
            nodes.forEach(node => {
                if (node.f) {
                    links.push({ from: node.f, to: node.key });
                }
            });

            myDiagram.model = new go.GraphLinksModel(nodes, links);
        })
        .catch(error => console.error('Error loading API data:', error));
}

// Calculate relationship between two selected nodes
function calculateRelationship() {
    const selection = myDiagram.selection;
    if (selection.count !== 2) {
        alert("Vui lòng chọn đúng 2 người để so sánh (Giữ Ctrl + Click).");
        return;
    }

    const nodes = [];
    selection.each(part => { if (part instanceof go.Node) nodes.push(part.data); });

    const p1 = nodes[0];
    const p2 = nodes[1];
    let resultText = "";

    const isFamily1 = Number.isInteger(p1.gen);
    const isFamily2 = Number.isInteger(p2.gen);

    if (!isFamily1 || !isFamily2) {
        resultText = `<b>${p1.n}</b> và <b>${p2.n}</b> là quan hệ xã hội hoặc không cùng nhánh trực hệ.`;
    } else {
        const genDiff = p1.gen - p2.gen;

        if (genDiff === 0) {
            resultText = `<b>${p1.n}</b> và <b>${p2.n}</b> cùng là <b>Đời thứ ${p1.gen}</b>.<br>Quan hệ: Anh/Chị Em (Họ).`;
        } else if (genDiff === -1) {
            resultText = `<b>${p1.n}</b> là bậc <b>Cha/Chú/Bác/Cô</b> của <b>${p2.n}</b>.`;
        } else if (genDiff === 1) {
            resultText = `<b>${p1.n}</b> là bậc <b>Cháu</b> của <b>${p2.n}</b>.`;
        } else if (Math.abs(genDiff) === 2) {
            const elder = genDiff < 0 ? p1 : p2;
            const younger = genDiff < 0 ? p2 : p1;
            resultText = `<b>${elder.n}</b> là bậc <b>Ông/Bà</b> của <b>${younger.n}</b>.`;
        } else {
            resultText = `Cách nhau ${Math.abs(genDiff)} đời. Quan hệ Cụ/Kỵ - Chắt/Chút.`;
        }
    }

    const resultBox = document.getElementById("relationship-result");
    if (resultBox) {
        document.getElementById("result-content").innerHTML = resultText;
        resultBox.style.display = "block";
    } else {
        alert(resultText.replace(/<[^>]*>/g, ''));
    }
}

window.addEventListener('DOMContentLoaded', init);
