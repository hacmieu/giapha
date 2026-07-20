/* Vũ Tộc Làng Chuông — viewer parity với Trần Tộc, đọc /api/public */
(function () {
  "use strict";

  var API = {
    tree: "/api/public/tree",
    graph: "/api/public/graph",
    person: function (id) {
      return "/api/public/people/" + encodeURIComponent(id);
    },
    search: "/api/public/search",
  };

  var ADMIN_URL = "https://vu-toc-lang-chuong-admin.hacmieu.workers.dev";

  var ROLE_LABEL = {
    dinh: "Đinh",
    dinh_adopted: "Đinh nhập tộc",
    daughter: "Con gái",
    daughter_contributor: "Con gái nhập tộc",
    daughter_descendant: "Con của con gái",
    spouse: "Dâu/Rể",
    external: "Quan hệ ngoài",
  };

  var go = window.go;
  var $ = go.GraphObject.make;
  var diagram = null;
  var treePayload = null;
  var graphPayload = null;
  var bloodlineNodes = [];
  var nodeById = {};
  var branchViewRootKey = null;
  var currentViewNodes = [];
  var searchAC = null;
  var personModalReturnFocus = null;
  var initialViewPending = false;

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function initial(name) {
    var parts = String(name || "").trim().split(/\s+/);
    return (parts[parts.length - 1] || "V").charAt(0).toUpperCase();
  }

  function genFill(gen) {
    gen = Number(gen);
    if (gen <= 1) return "#fef3c7";
    if (gen <= 3) return "#eff6ff";
    if (gen <= 5) return "#f0f9ff";
    if (gen <= 7) return "#f0fdf4";
    if (gen <= 9) return "#fff7ed";
    return "#fef2f2";
  }
  function genStroke(gen) {
    gen = Number(gen);
    if (gen <= 1) return "#78350f";
    if (gen <= 3) return "#1d4ed8";
    if (gen <= 5) return "#0369a1";
    if (gen <= 7) return "#047857";
    if (gen <= 9) return "#b45309";
    return "#b91c1c";
  }
  function genAccent(gen) {
    return genStroke(gen);
  }

  function isNhapTocRole(role) {
    return role === "daughter_contributor" || role === "dinh_adopted";
  }

  function nodeFill(data) {
    if (isNhapTocRole(data.lineageRole)) return "#fdf4ff";
    if (data.lineageRole === "external") return "#faf5ff";
    if (data.lineageRole === "spouse") return "#fdf2f8";
    return genFill(data.generation);
  }

  function nodeStroke(data) {
    if (isNhapTocRole(data.lineageRole)) return "#9333ea";
    if (data.lineageRole === "external") return "#7c3aed";
    if (data.lineageRole === "spouse") return "#db2777";
    return genStroke(data.generation);
  }

  function spouseLabel(node) {
    var list = node.spouses || [];
    if (!list.length) return "";
    var names = list
      .map(function (s) {
        var p = nodeById[s.personId];
        return p ? p.name : null;
      })
      .filter(Boolean);
    if (!names.length) return "";
    var nameText = names.length === 1 ? names[0] : names.length + " người";
    // Trên thẻ: icon theo giới tính người đang xem (nam → vợ, nữ → chồng).
    if (node.gender === "female") return "♂ " + nameText;
    if (node.gender === "male") return "♀ " + nameText;
    return "⚭ " + nameText;
  }

  function spouseTooltipLine(node) {
    if (!node.spouseText) return "";
    var names = (node.spouses || [])
      .map(function (s) {
        var p = nodeById[s.personId];
        return p ? p.name : null;
      })
      .filter(Boolean);
    if (!names.length) return node.spouseText;
    var label =
      node.gender === "female" ? "Chồng" : node.gender === "male" ? "Vợ" : "Vợ/Chồng";
    return label + ": " + names.join(", ");
  }

  // ── Diagram ─────────────────────────────────────────────────────
  function initDiagram() {
    diagram = $(go.Diagram, "myDiagramDiv", {
      undoManager: { isEnabled: false },
      allowDelete: false,
      allowCopy: false,
      "toolManager.mouseWheelBehavior": go.ToolManager.WheelZoom,
      layout: $(go.TreeLayout, {
        angle: 90,
        layerSpacing: 50,
        nodeSpacing: 15,
        compaction: go.TreeLayout.CompactionBlock,
        sorting: go.TreeLayout.SortingAscending,
      }),
    });

    diagram.addDiagramListener("InitialLayoutCompleted", function () {
      applyInitialView();
    });
    diagram.addDiagramListener("ViewportBoundsChanged", syncZoomSlider);

    diagram.nodeTemplate = $(
      go.Node,
      "Auto",
      {
        cursor: "pointer",
        selectionAdorned: true,
        selectionAdornmentTemplate: $(
          go.Adornment,
          "Auto",
          $(go.Shape, "RoundedRectangle", {
            fill: null,
            stroke: "#d50000",
            strokeWidth: 3,
            parameter1: 8,
          }),
          $(go.Placeholder),
        ),
        toolTip: $(
          go.Adornment,
          "Auto",
          $(go.Shape, { fill: "#fffde7", stroke: "#f59e0b", parameter1: 6 }),
          $(
            go.TextBlock,
            {
              margin: 8,
              font: "12px Arial",
              maxSize: new go.Size(220, NaN),
              wrap: go.TextBlock.WrapFit,
            },
            new go.Binding("text", "", function (d) {
              var lines = [d.name];
              if (isNhapTocRole(d.lineageRole)) lines.push("Nhập tộc");
              var spouseLine = spouseTooltipLine(d);
              if (spouseLine) lines.push(spouseLine);
              if (d.generation != null) lines.push("Đời " + d.generation);
              if (d.isDeceased) lines.push("Đã mất");
              return lines.join("\n");
            }),
          ),
        ),
        click: function (e, node) {
          if (String(node.data.id).startsWith("social-target:")) return;
          openPerson(node.data.id);
        },
      },
      $(
        go.Shape,
        "RoundedRectangle",
        { parameter1: 8, strokeWidth: 2 },
        new go.Binding("fill", "", nodeFill),
        new go.Binding("stroke", "", nodeStroke),
        new go.Binding("strokeDashArray", "", function (d) {
          return isNhapTocRole(d.lineageRole) ? [5, 3] : null;
        }),
        new go.Binding("strokeWidth", "generation", function (g) {
          return Number(g) <= 1 ? 3 : 2;
        }),
      ),
      $(
        go.Panel,
        "Vertical",
        {
          margin: new go.Margin(8, 8, 8, 8),
          desiredSize: new go.Size(108, 138),
          defaultAlignment: go.Spot.Center,
        },
        $(
          go.Panel,
          "Spot",
          { margin: new go.Margin(0, 0, 6, 0) },
          $(
            go.Panel,
            "Spot",
            { isClipping: true },
            $(go.Shape, "RoundedRectangle", {
              width: 52,
              height: 62,
              parameter1: 6,
              strokeWidth: 0,
              fill: "#f2ead9",
            }),
            $(
              go.Shape,
              "Ellipse",
              {
                width: 46,
                height: 34,
                strokeWidth: 0,
                alignment: new go.Spot(0.5, 1, 0, 8),
              },
              new go.Binding("fill", "generation", genAccent),
            ),
            $(go.Shape, "Circle", {
              width: 21,
              height: 21,
              strokeWidth: 0,
              fill: "#d9b28c",
              alignment: new go.Spot(0.5, 0.32),
            }),
          ),
          $(
            go.Shape,
            "RoundedRectangle",
            {
              width: 52,
              height: 62,
              parameter1: 6,
              fill: null,
              strokeWidth: 1.5,
            },
            new go.Binding("stroke", "generation", function (g) {
              return Number(g) <= 1 ? "#78350f" : "#c8943e";
            }),
          ),
          $(
            go.Panel,
            "Auto",
            {
              alignment: new go.Spot(1, 1, -1, -1),
              visible: false,
            },
            new go.Binding("visible", "lineageRole", isNhapTocRole),
            $(go.Shape, "Circle", {
              width: 16,
              height: 16,
              fill: "#9333ea",
              stroke: "#fff",
              strokeWidth: 1,
            }),
            $(go.TextBlock, {
              text: "NT",
              font: "bold 6pt Arial",
              stroke: "#fff",
            }),
          ),
        ),
        $(
          go.TextBlock,
          {
            width: 104,
            height: 32,
            maxLines: 2,
            overflow: go.TextBlock.OverflowEllipsis,
            wrap: go.TextBlock.WrapFit,
            textAlign: "center",
            verticalAlignment: go.Spot.Center,
            font: "bold 10pt Arial, sans-serif",
            stroke: "#111827",
          },
          new go.Binding("text", "name"),
        ),
        $(
          go.TextBlock,
          {
            font: "9pt Arial",
            textAlign: "center",
            margin: new go.Margin(2, 0, 0, 0),
          },
          new go.Binding("text", "generation", function (g) {
            return g == null ? "" : "Đời " + g;
          }),
          new go.Binding("stroke", "generation", genStroke),
        ),
        $(
          go.TextBlock,
          {
            height: 14,
            width: 104,
            maxLines: 1,
            overflow: go.TextBlock.OverflowEllipsis,
            font: "8pt Arial, 'Segoe UI Symbol', 'Noto Sans Symbols', sans-serif",
            stroke: "#9d174d",
            textAlign: "center",
            margin: new go.Margin(1, 0, 0, 0),
          },
          new go.Binding("text", "", function (d) {
            if (d.wifeLabel) return d.wifeLabel;
            if (isNhapTocRole(d.lineageRole)) return "Nhập tộc";
            return d.spouseText || " ";
          }),
          new go.Binding("visible", "", function (d) {
            return Boolean(d.wifeLabel || d.spouseText || isNhapTocRole(d.lineageRole));
          }),
        ),
      ),
    );

    diagram.groupTemplate = $(
      go.Group,
      "Auto",
      {
        layout: $(go.GridLayout, {
          wrappingColumn: Infinity,
          alignment: go.GridLayout.Position,
          cellSize: new go.Size(1, 1),
          spacing: new go.Size(4, 4),
          sorting: go.GridLayout.SortingAscending,
          comparer: function (a, b) {
            var sa = a.data && a.data.familySlot != null ? Number(a.data.familySlot) : 99;
            var sb = b.data && b.data.familySlot != null ? Number(b.data.familySlot) : 99;
            if (sa !== sb) return sa - sb;
            var na = (a.data && a.data.name) || "";
            var nb = (b.data && b.data.name) || "";
            return na < nb ? -1 : na > nb ? 1 : 0;
          },
        }),
        isSubGraphExpanded: true,
        selectable: false,
        computesBoundsAfterDrag: true,
      },
      $(go.Shape, "RoundedRectangle", {
        parameter1: 8,
        fill: "rgba(253, 242, 248, 0.5)",
        stroke: "#f9a8d4",
        strokeWidth: 1,
        strokeDashArray: [4, 2],
      }),
      $(go.Placeholder, { padding: 6 }),
    );

    diagram.linkTemplate = $(
      go.Link,
      { routing: go.Link.Orthogonal, corner: 6, selectable: false },
      $(
        go.Shape,
        { strokeWidth: 1.5, stroke: "#9ca3af" },
        new go.Binding("stroke", "linkKind", function (kind) {
          if (kind === "spouse") return "#a62c2b";
          if (kind === "social") return "#7c3aed";
          if (kind === "mother") return "#db2777";
          if (kind === "father") return "#2563eb";
          return "#9ca3af";
        }),
        new go.Binding("strokeDashArray", "linkKind", function (kind) {
          return kind === "spouse" || kind === "social" || kind === "mother"
            ? [6, 4]
            : null;
        }),
        new go.Binding("strokeWidth", "linkKind", function (kind) {
          return kind === "father" ? 2 : 1.5;
        }),
      ),
      $(
        go.Panel,
        "Auto",
        new go.Binding("visible", "label", function (label) {
          return Boolean(label);
        }),
        $(go.Shape, "RoundedRectangle", {
          fill: "rgba(255,255,255,.92)",
          stroke: "#d9d1c2",
        }),
        $(
          go.TextBlock,
          { margin: 3, font: "9px Arial", stroke: "#4b5563" },
          new go.Binding("text", "label"),
        ),
      ),
    );
  }

  function createTreeModel(nodes) {
    var valid = {};
    nodes.forEach(function (n) {
      valid[n.id] = true;
    });
    var data = nodes.map(function (n) {
      var copy = {
        id: n.id,
        name: n.name,
        gender: n.gender,
        generation: n.generation,
        branchId: n.branchId,
        lineageRole: n.lineageRole,
        isDeceased: n.isDeceased,
        spouseText: n.spouseText || "",
      };
      if (n.fatherId && valid[n.fatherId]) copy.fatherId = n.fatherId;
      return copy;
    });
    return new go.TreeModel({
      nodeKeyProperty: "id",
      nodeParentKeyProperty: "fatherId",
      nodeDataArray: data,
    });
  }

  function createGraphModel(nodes, links) {
    return new go.GraphLinksModel({
      nodeKeyProperty: "id",
      linkKeyProperty: "id",
      linkFromKeyProperty: "from",
      linkToKeyProperty: "to",
      nodeGroupKeyProperty: "group",
      nodeDataArray: nodes.map(function (node) {
        var copy = {
          id: node.id,
          name: node.name || "",
          gender: node.gender,
          generation: node.generation,
          lineageRole: node.lineageRole,
          treeScope: node.treeScope,
          isDeceased: node.isDeceased,
          isNhapToc: isNhapTocRole(node.lineageRole),
          spouseText: node.spouseText || "",
          wifeLabel: node.wifeLabel || "",
          familySlot: node.familySlot != null ? node.familySlot : null,
        };
        if (node.isGroup) {
          copy.isGroup = true;
          copy.isFamily = true;
        }
        if (node.group) copy.group = node.group;
        return copy;
      }),
      linkDataArray: links,
    });
  }

  function resolveCoupleEndpoints(relation, nodeMap) {
    var a = nodeMap[relation.personAId];
    var b = nodeMap[relation.personBId];
    if (!a || !b) return null;

    var wifeId = relation.wifePersonId;
    var husbandId = null;
    if (wifeId === relation.personAId) husbandId = relation.personBId;
    else if (wifeId === relation.personBId) husbandId = relation.personAId;
    else if (a.gender === "male" && b.gender === "female") {
      husbandId = a.id;
      wifeId = b.id;
    } else if (b.gender === "male" && a.gender === "female") {
      husbandId = b.id;
      wifeId = a.id;
    } else {
      husbandId = relation.personAId;
      wifeId = relation.personBId;
    }
    return { husbandId: husbandId, wifeId: wifeId };
  }

  function selectGraphData(view) {
    var allNodes = (graphPayload && graphPayload.nodes) || [];
    var selectedIds = {};

    if (view === "family") {
      allNodes.forEach(function (node) {
        if (node.treeScope === "main") selectedIds[node.id] = true;
      });
      (graphPayload.spouseRelations || []).forEach(function (relation) {
        if (selectedIds[relation.personAId] || selectedIds[relation.personBId]) {
          selectedIds[relation.personAId] = true;
          selectedIds[relation.personBId] = true;
        }
      });
    } else {
      allNodes.forEach(function (node) {
        selectedIds[node.id] = true;
      });
    }

    // Person map — không ghi spouseText (đã hiện vợ trong group).
    var nodeMap = {};
    allNodes.forEach(function (node) {
      if (!selectedIds[node.id]) return;
      nodeMap[node.id] = Object.assign({}, node, {
        spouseText: "",
        wifeLabel: "",
      });
    });

    // Gom vợ theo chồng — giống relationships.html (fam_<husband>).
    var wivesByHusband = {};
    (graphPayload.spouseRelations || []).forEach(function (relation) {
      if (!selectedIds[relation.personAId] || !selectedIds[relation.personBId]) return;
      var ends = resolveCoupleEndpoints(relation, nodeMap);
      if (!ends || !nodeMap[ends.husbandId] || !nodeMap[ends.wifeId]) return;
      if (!wivesByHusband[ends.husbandId]) wivesByHusband[ends.husbandId] = [];
      wivesByHusband[ends.husbandId].push({
        id: ends.wifeId,
        order: relation.wifeOrder == null ? 999 : Number(relation.wifeOrder),
      });
    });

    var familyGroupKeys = {};
    var wifeInGroup = {};
    var groupNodes = [];
    Object.keys(wivesByHusband).forEach(function (husbandId) {
      var seenWives = {};
      var wives = wivesByHusband[husbandId]
        .filter(function (wife) {
          if (!nodeMap[wife.id] || wifeInGroup[wife.id] || seenWives[wife.id]) return false;
          seenWives[wife.id] = true;
          return true;
        })
        .sort(function (a, b) {
          return a.order - b.order;
        });
      if (!wives.length || !nodeMap[husbandId]) return;

      var groupKey = "fam:" + husbandId;
      familyGroupKeys[husbandId] = groupKey;
      groupNodes.push({
        id: groupKey,
        isGroup: true,
        isFamily: true,
        name: "",
        generation: nodeMap[husbandId].generation,
        lineageRole: "family_group",
        treeScope: nodeMap[husbandId].treeScope,
        isDeceased: false,
        spouseText: "",
      });
      nodeMap[husbandId].group = groupKey;
      nodeMap[husbandId].familySlot = 0; // chồng luôn trái
      wives.forEach(function (wife, index) {
        nodeMap[wife.id].group = groupKey;
        nodeMap[wife.id].familySlot = index + 1; // vợ bên phải, theo wifeOrder
        wifeInGroup[wife.id] = true;
        if (wives.length > 1) {
          nodeMap[wife.id].wifeLabel =
            "Bà " + (wife.order < 999 ? wife.order : index + 1);
        }
      });
    });

    var fatherOf = {};
    var motherOf = {};
    (graphPayload.parentRelations || []).forEach(function (relation) {
      if (!selectedIds[relation.parentId] || !selectedIds[relation.childId]) return;
      if (relation.relationType === "father") fatherOf[relation.childId] = relation.parentId;
      if (relation.relationType === "mother") motherOf[relation.childId] = relation.parentId;
    });

    var links = [];
    Object.keys(nodeMap).forEach(function (childId) {
      var child = nodeMap[childId];
      var fatherId = fatherOf[childId];
      var motherId = motherOf[childId];
      if (fatherId && nodeMap[fatherId]) {
        links.push({
          id: "father:" + childId,
          from: familyGroupKeys[fatherId] || fatherId,
          to: child.group || childId,
          linkKind: "father",
          label: "",
        });
      }
      if (motherId && nodeMap[motherId]) {
        links.push({
          id: "mother:" + childId,
          from: motherId,
          to: childId,
          linkKind: "mother",
          label: "mẹ",
        });
      }
    });

    if (view === "relations") {
      (graphPayload.socialRelations || []).forEach(function (relation) {
        var targetId = relation.toPersonId;
        if (!targetId && relation.toPersonName) {
          targetId = "social-target:" + relation.id;
          nodeMap[targetId] = {
            id: targetId,
            name: relation.toPersonName,
            gender: relation.toPersonGender || "male",
            generation: null,
            lineageRole: "external",
            treeScope: "external",
            isDeceased: false,
            spouseText: "",
            wifeLabel: "",
          };
          selectedIds[targetId] = true;
        }
        if (targetId && nodeMap[relation.fromPersonId] && nodeMap[targetId]) {
          links.push({
            id: "social:" + relation.id,
            from: relation.fromPersonId,
            to: targetId,
            linkKind: "social",
            label: relation.label || relation.relationType || "quan hệ khác",
          });
        }
      });
    }

    var personNodes = Object.keys(nodeMap)
      .map(function (id) {
        return nodeMap[id];
      })
      .sort(function (a, b) {
        var ga = a.group || "";
        var gb = b.group || "";
        if (ga !== gb) return ga < gb ? -1 : 1;
        var sa = a.familySlot != null ? a.familySlot : 99;
        var sb = b.familySlot != null ? b.familySlot : 99;
        return sa - sb;
      });
    return {
      nodes: groupNodes.concat(personNodes),
      links: links,
      personCount: personNodes.length,
      familyGroupCount: groupNodes.length,
    };
  }

  function buildBloodline() {
    bloodlineNodes = (treePayload.nodes || [])
      .filter(function (n) {
        return n.lineageRole !== "spouse";
      })
      .map(function (n) {
        return Object.assign({}, n, { spouseText: spouseLabel(n) });
      });
  }

  /** Dòng chính: gom cặp nhập tộc (daughter_contributor / dinh_adopted) cạnh chồng/vợ trên cây. */
  function buildLineageGraph() {
    var baseNodes = (treePayload.nodes || []).filter(function (n) {
      return n.lineageRole !== "spouse";
    });
    var nodeMap = {};
    baseNodes.forEach(function (node) {
      nodeMap[node.id] = Object.assign({}, node, {
        spouseText: "",
        wifeLabel: "",
      });
    });

    var familyGroupKeys = {};
    var inCoupleGroup = {};
    var groupNodes = [];

    function attachCouple(husbandId, wifeId) {
      if (!nodeMap[husbandId] || !nodeMap[wifeId]) return;
      if (inCoupleGroup[wifeId]) return;
      var groupKey = familyGroupKeys[husbandId];
      if (!groupKey) {
        groupKey = "fam:" + husbandId;
        familyGroupKeys[husbandId] = groupKey;
        groupNodes.push({
          id: groupKey,
          isGroup: true,
          isFamily: true,
          name: "",
          generation: nodeMap[husbandId].generation,
          lineageRole: "family_group",
          treeScope: nodeMap[husbandId].treeScope,
          isDeceased: false,
          spouseText: "",
        });
        nodeMap[husbandId].group = groupKey;
        nodeMap[husbandId].familySlot = 0;
        inCoupleGroup[husbandId] = true;
      }
      nodeMap[wifeId].group = groupKey;
      nodeMap[wifeId].familySlot =
        nodeMap[wifeId].familySlot != null ? nodeMap[wifeId].familySlot : 1;
      inCoupleGroup[wifeId] = true;
      nodeMap[husbandId].spouseText = "";
    }

    baseNodes.forEach(function (person) {
      (person.spouses || []).forEach(function (sp) {
        var partner = nodeMap[sp.personId];
        if (!partner) return;
        if (!isNhapTocRole(person.lineageRole) && !isNhapTocRole(partner.lineageRole)) {
          return;
        }
        var husbandId = null;
        var wifeId = null;
        if (person.gender === "male" && partner.gender === "female") {
          husbandId = person.id;
          wifeId = partner.id;
        } else if (person.gender === "female" && partner.gender === "male") {
          husbandId = partner.id;
          wifeId = person.id;
        } else if (sp.wifePersonId === person.id) {
          wifeId = person.id;
          husbandId = partner.id;
        } else if (sp.wifePersonId === partner.id) {
          wifeId = partner.id;
          husbandId = person.id;
        }
        if (husbandId && wifeId) attachCouple(husbandId, wifeId);
      });
    });

    baseNodes.forEach(function (person) {
      if (!inCoupleGroup[person.id]) {
        nodeMap[person.id].spouseText = spouseLabel(person);
      }
    });

    var links = [];
    baseNodes.forEach(function (child) {
      var childData = nodeMap[child.id];
      if (!childData || !child.fatherId || !nodeMap[child.fatherId]) return;
      links.push({
        id: "father:" + child.id,
        from: familyGroupKeys[child.fatherId] || child.fatherId,
        to: childData.group || child.id,
        linkKind: "father",
        label: "",
      });
    });

    var personNodes = Object.keys(nodeMap).map(function (id) {
      return nodeMap[id];
    });
    personNodes.sort(function (a, b) {
      var ga = a.group || "";
      var gb = b.group || "";
      if (ga !== gb) return ga < gb ? -1 : 1;
      var sa = a.familySlot != null ? a.familySlot : 99;
      var sb = b.familySlot != null ? b.familySlot : 99;
      return sa - sb;
    });

    return { nodes: groupNodes.concat(personNodes), links: links };
  }

  function applyLineageView(peopleSubset) {
    var lineageData = buildLineageGraph();
    if (peopleSubset && peopleSubset.length) {
      var allowed = {};
      peopleSubset.forEach(function (person) {
        allowed[person.id] = true;
      });
      lineageData.nodes.forEach(function (node) {
        if (node.isGroup || !allowed[node.id]) return;
        var source = nodeById[node.id];
        if (!source) return;
        (source.spouses || []).forEach(function (sp) {
          var partner = nodeById[sp.personId];
          if (partner && isNhapTocRole(partner.lineageRole)) {
            allowed[partner.id] = true;
          }
        });
      });
      var keepGroups = {};
      lineageData.nodes.forEach(function (node) {
        if (node.isGroup) return;
        if (allowed[node.id] && node.group) keepGroups[node.group] = true;
      });
      var valid = {};
      lineageData.nodes = lineageData.nodes.filter(function (node) {
        if (node.isGroup) return Boolean(keepGroups[node.id]);
        if (allowed[node.id]) {
          valid[node.id] = true;
          return true;
        }
        return false;
      });
      lineageData.nodes.forEach(function (node) {
        if (node.isGroup) valid[node.id] = true;
      });
      lineageData.links = lineageData.links.filter(function (link) {
        return valid[link.from] && valid[link.to];
      });
    }
    currentViewNodes = lineageData.nodes.filter(function (node) {
      return !node.isGroup;
    });
    diagram.model = createGraphModel(lineageData.nodes, lineageData.links);
    applyFiltersVisibility();
  }

  function configureLayout(view) {
    var layoutMode = el("layoutMode").value;
    if (layoutMode === "force") {
      diagram.layout = $(go.ForceDirectedLayout, {
        defaultSpringLength: view === "relations" ? 75 : 60,
        defaultElectricalCharge: view === "relations" ? 260 : 200,
      });
    } else if (view === "lineage" || branchViewRootKey) {
      diagram.layout = $(go.TreeLayout, {
        angle: 90,
        layerSpacing: 50,
        nodeSpacing: 15,
        compaction: go.TreeLayout.CompactionBlock,
      });
    } else {
      // Gia đình / quan hệ: TreeLayout như Django relationships.html (group = một node cây).
      diagram.layout = $(go.TreeLayout, {
        angle: 90,
        layerSpacing: 55,
        nodeSpacing: 18,
        arrangement: go.TreeLayout.ArrangementHorizontal,
        sorting: go.TreeLayout.SortingForwards,
      });
    }
  }

  function resetStage() {
    if (!diagram) return;
    diagram.clearSelection();
    diagram.layout.invalidateLayout();
    diagram.layoutDiagram(true);
    requestAnimationFrame(function () {
      applyInitialView();
    });
  }

  function rebuildCurrentView() {
    if (!diagram) return;
    var view = el("viewMode").value;
    branchViewRootKey = null;
    el("branchViewBanner").setAttribute("hidden", "");
    configureLayout(view);

    if (view === "lineage") {
      applyLineageView();
    } else {
      var data = selectGraphData(view);
      currentViewNodes = data.nodes.filter(function (node) {
        return !node.isGroup;
      });
      diagram.model = createGraphModel(data.nodes, data.links);
    }
    applyFiltersVisibility();
    updateStats();
    resetStage();
  }

  function ensureGraphPayload() {
    if (graphPayload) return Promise.resolve(graphPayload);
    return fetch(API.graph)
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (payload) {
        graphPayload = payload;
        (payload.nodes || []).forEach(function (node) {
          nodeById[node.id] = node;
        });
        return payload;
      });
  }

  function changeDataView() {
    var view = el("viewMode").value;
    el("filterGeneration").value = "";
    if (view === "lineage") {
      rebuildCurrentView();
      return;
    }
    el("myDiagramDiv").classList.add("is-loading-view");
    ensureGraphPayload()
      .then(function () {
        rebuildCurrentView();
      })
      .catch(function (error) {
        window.alert("Không tải được view: " + error.message);
        el("viewMode").value = "lineage";
        rebuildCurrentView();
      })
      .finally(function () {
        el("myDiagramDiv").classList.remove("is-loading-view");
      });
  }

  function applyInitialView() {
    if (!diagram) return;
    if (!diagram.div || diagram.div.offsetWidth === 0) {
      initialViewPending = true;
      return;
    }
    initialViewPending = false;
    diagram.scale = 0.7;
    var best = null;
    var bestScore = -1;
    diagram.nodes.each(function (node) {
      if (!node.visible) return;
      if (node instanceof go.Group || node.data.isGroup) return;
      var d = node.data;
      var gen = d.generation == null ? 99 : Number(d.generation);
      var isDinh = d.lineageRole === "dinh" || d.lineageRole === "dinh_adopted";
      var size = 0;
      try {
        node.findTreeParts().each(function () {
          size += 1;
        });
      } catch (err) {
        size = 1;
      }
      var score = (isDinh ? 100000 : 0) - gen * 1000 + size;
      if (score > bestScore) {
        bestScore = score;
        best = node.containingGroup || node;
      }
    });
    if (best) {
      var vb = diagram.viewportBounds;
      diagram.position = new go.Point(
        best.actualBounds.centerX - vb.width / 2,
        best.actualBounds.y - 24,
      );
      if (!(best instanceof go.Group)) diagram.select(best);
    }
    syncZoomSlider();
  }

  // ── Sidebar / filters ───────────────────────────────────────────
  function updateStats() {
    var people = currentViewNodes.length ? currentViewNodes : bloodlineNodes;
    var gens = people
      .map(function (p) {
        return Number(p.generation);
      })
      .filter(function (g) {
        return Number.isFinite(g);
      });
    el("totalPeople").textContent = String(people.length);
    el("totalRelationships").textContent = String(
      diagram && diagram.model instanceof go.GraphLinksModel
        ? diagram.model.linkDataArray.length
        : people.filter(function (p) {
            return !!p.fatherId;
          }).length,
    );
    var viewLabel = {
      lineage: "Dòng chính",
      family: "Gia đình mở rộng",
      relations: "Quan hệ khác",
    }[el("viewMode").value];
    if (gens.length) {
      el("generationRange").textContent =
        viewLabel + " · Đời " + Math.min.apply(null, gens) + "–" + Math.max.apply(null, gens);
    } else {
      el("generationRange").textContent = viewLabel;
    }
  }

  function populateGenerationFilter() {
    var sel = el("filterGeneration");
    var gens = Array.from(
      new Set(
        bloodlineNodes
          .map(function (p) {
            return Number(p.generation);
          })
          .filter(function (g) {
            return Number.isFinite(g);
          }),
      ),
    ).sort(function (a, b) {
      return a - b;
    });
    sel.innerHTML = '<option value="">Tất Cả</option>';
    gens.forEach(function (g) {
      var opt = document.createElement("option");
      opt.value = String(g);
      opt.textContent = "Đến đời thứ " + g;
      sel.appendChild(opt);
    });
  }

  function applyFiltersVisibility() {
    if (!diagram) return;
    var maxGen = el("filterGeneration").value;
    var maxGenNum = maxGen === "" ? null : Number(maxGen);
    diagram.startTransaction("filter");
    diagram.nodes.each(function (node) {
      if (node instanceof go.Group || node.data.isGroup) return;
      var visible = true;
      if (maxGenNum !== null && node.data.generation != null) {
        visible = Number(node.data.generation) <= maxGenNum;
      }
      node.visible = visible;
    });
    diagram.nodes.each(function (node) {
      if (!(node instanceof go.Group) && !node.data.isGroup) return;
      var anyMemberVisible = false;
      node.memberParts.each(function (part) {
        if (part instanceof go.Node && !(part instanceof go.Group) && part.visible) {
          anyMemberVisible = true;
        }
      });
      node.visible = maxGenNum === null ? true : anyMemberVisible;
    });
    diagram.links.each(function (link) {
      link.visible =
        !!(link.fromNode && link.toNode && link.fromNode.visible && link.toNode.visible);
    });
    diagram.commitTransaction("filter");
  }

  function filterByGeneration() {
    rebuildCurrentView();
  }

  function changeLayoutMode() {
    rebuildCurrentView();
  }

  // ── Branch / descendants ────────────────────────────────────────
  function collectDescendants(rootKey, endGeneration) {
    var all = bloodlineNodes;
    var root = all.find(function (p) {
      return String(p.id) === String(rootKey);
    });
    if (!root) return [];
    // Đi theo cả cha và mẹ — con của con gái thường chỉ có parent_relations.mother.
    var childrenByParent = {};
    all.forEach(function (p) {
      [p.fatherId, p.motherId].forEach(function (parentId) {
        if (!parentId) return;
        var key = String(parentId);
        if (!childrenByParent[key]) childrenByParent[key] = [];
        childrenByParent[key].push(p);
      });
    });
    var limit = endGeneration ? Number(endGeneration) : Infinity;
    var result = [];
    var queue = [root];
    var seen = {};
    while (queue.length) {
      var person = queue.shift();
      var key = String(person.id);
      if (seen[key]) continue;
      seen[key] = true;
      result.push(person);
      (childrenByParent[key] || []).forEach(function (child) {
        var childKey = String(child.id);
        if (seen[childKey]) return;
        var generation = Number(child.generation) || 0;
        if (generation <= limit) queue.push(child);
      });
    }
    return result;
  }

  function drawDescendantBranchFromModal() {
    var select = el("branchEndGeneration");
    if (!select || !diagram) return;
    var rootKey = select.dataset.rootKey;
    var endGeneration = select.value ? Number(select.value) : null;
    var people = collectDescendants(rootKey, endGeneration);
    if (!people.length) return;
    var root = people[0];
    branchViewRootKey = rootKey;
    closePersonModal();
    setMobilePane("diagram");
    requestAnimationFrame(function () {
      configureLayout("lineage");
      applyLineageView(people);
      var banner = el("branchViewBanner");
      var text = el("branchViewText");
      if (text) {
        text.textContent =
          "Nhánh " +
          (root.name || "Chưa rõ") +
          " · " +
          (endGeneration ? "đến Đời " + endGeneration : "tất cả con cháu") +
          " · " +
          people.length +
          " người";
      }
      if (banner) banner.removeAttribute("hidden");
      el("filterGeneration").value = "";
      resetStage();
    });
  }

  function showFullTree() {
    if (!diagram || !bloodlineNodes.length) return;
    branchViewRootKey = null;
    el("viewMode").value = "lineage";
    el("filterGeneration").value = "";
    rebuildCurrentView();
    setMobilePane("diagram");
  }

  // ── Search ──────────────────────────────────────────────────────
  function initSearch() {
    var input = el("searchInput");
    if (!input || typeof window.autocompleteInit !== "function") return;
    if (searchAC) searchAC.destroy();
    searchAC = window.autocompleteInit(input, {
      fetchUrl: API.search,
      displayField: "name",
      valueField: "id",
      minChars: 2,
      maxResults: 20,
      debounceMs: 220,
      iconFn: function (item) {
        if (item.tree_scope === "external") return "🔗";
        if (item.lineage_role === "spouse") return "💍";
        if (item.lineage_role === "daughter" || item.lineage_role === "daughter_contributor")
          return "👩";
        return "👨";
      },
      infoFn: function (item) {
        var bits = [];
        if (item.generation != null) bits.push("Đời " + item.generation);
        bits.push(ROLE_LABEL[item.lineage_role] || item.lineage_role || "");
        if (item.tree_scope === "external") bits.push("quan hệ ngoài");
        return bits.filter(Boolean).join(" · ");
      },
      onSelect: function (item) {
        setMobilePane("diagram");
        requestAnimationFrame(function () {
          focusOrOpen(item.id);
        });
      },
    });
  }

  function focusOrOpen(id) {
    function focusAfterReset() {
      resetStage();
      requestAnimationFrame(function () {
        var node = diagram && diagram.findNodeForKey(id);
        if (node) {
          node.visible = true;
          diagram.select(node);
          diagram.commandHandler.scrollToPart(node);
        }
        openPerson(id);
      });
    }

    var currentNode = diagram && diagram.findNodeForKey(id);
    if (currentNode && !branchViewRootKey) {
      rebuildCurrentView();
      focusAfterReset();
      return;
    }

    ensureGraphPayload()
      .then(function () {
        var person = nodeById[id];
        el("viewMode").value =
          person && person.treeScope === "external" ? "relations" : "family";
        el("filterGeneration").value = "";
        rebuildCurrentView();
        focusAfterReset();
      })
      .catch(function () {
        openPerson(id);
      });
  }

  // ── Modal ───────────────────────────────────────────────────────
  function openPerson(id) {
    var modal = el("personModal");
    if (!modal) return;
    el("personModalName").textContent = "Đang tải…";
    el("personGeneration").textContent = "Đời --";
    el("personModalId").textContent = "";
    el("personModalBody").innerHTML = "";
    el("personMonogram").textContent = "…";
    el("personPortrait").removeAttribute("src");
    personModalReturnFocus = document.activeElement;

    if (typeof modal.showModal === "function") {
      if (!modal.open) modal.showModal();
    } else {
      modal.setAttribute("open", "");
    }

    fetch(API.person(id))
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(renderPerson)
      .catch(function () {
        el("personModalName").textContent = "Không tải được hồ sơ";
      });
  }

  function personLink(p) {
    return (
      '<button type="button" class="person-link" data-id="' +
      escapeHtml(p.id) +
      '">' +
      escapeHtml(p.name || "Chưa rõ") +
      "</button>"
    );
  }

  function fieldRaw(label, html, wide) {
    if (html === undefined || html === null || html === "") return "";
    return (
      '<div class="profile-field' +
      (wide ? " wide" : "") +
      '"><span class="profile-label">' +
      escapeHtml(label) +
      '</span><span class="profile-value">' +
      html +
      "</span></div>"
    );
  }
  function field(label, value, wide) {
    if (value === undefined || value === null || value === "") return "";
    return fieldRaw(label, escapeHtml(value), wide);
  }

  function renderPerson(payload) {
    var p = payload.person;
    var portrait = el("personPortrait");
    if (p.photoUrl) {
      portrait.src = p.photoUrl;
      portrait.alt = "Portrait " + (p.name || "");
    } else {
      portrait.removeAttribute("src");
      portrait.alt = "";
    }
    el("personMonogram").textContent = initial(p.name);
    el("personGeneration").textContent =
      p.generation != null ? "Đời " + p.generation : "Đời --";
    el("personModalName").textContent = p.name || "Chưa rõ họ tên";
    var role = ROLE_LABEL[p.lineageRole] || p.lineageRole || "";
    if (p.treeScope === "external") role += (role ? " · " : "") + "quan hệ ngoài";
    el("personModalId").textContent =
      "Mã · " + (p.personCode || p.legacyId || p.id) + (role ? " · " + role : "");

    var parents = payload.parents || [];
    var father = parents.find(function (r) {
      return r.relation_type === "father";
    });
    var mother = parents.find(function (r) {
      return r.relation_type === "mother";
    });
    var spouses = payload.spouses || [];
    var children = payload.children || [];
    var socialRelations = payload.socialRelations || [];
    var spouseLabel =
      p.gender === "female" ? "Chồng" : p.gender === "male" ? "Vợ" : "Vợ/Chồng";

    var body =
      '<section class="profile-section" aria-labelledby="section-vitals">' +
      '<h3 id="section-vitals">Thân thế</h3><div class="profile-grid">' +
      field("Giới tính", p.gender === "female" ? "Nữ" : "Nam") +
      field("Năm sinh", p.birthDate || "Chưa ghi") +
      (p.isDeceased
        ? field("Ngày mất", p.deathDate || "Đã mất") +
          field("Ngày mất (ÂL)", p.deathDateLunar || "")
        : "") +
      "</div></section>";

    body +=
      '<section class="profile-section" aria-labelledby="section-family">' +
      '<h3 id="section-family">Gia đình</h3><div class="profile-grid">' +
      (father ? fieldRaw("Thân phụ", personLink(father)) : field("Thân phụ", "Chưa xác định")) +
      (mother ? fieldRaw("Thân mẫu", personLink(mother)) : field("Thân mẫu", "Chưa xác định")) +
      (spouses.length
        ? fieldRaw(
            spouseLabel,
            '<span class="person-link-list">' +
              spouses
                .map(function (s) {
                  var tag = s.wife_order ? " (vợ thứ " + s.wife_order + ")" : "";
                  return personLink(s) + (tag ? escapeHtml(tag) : "");
                })
                .join("") +
              "</span>",
            true,
          )
        : field(spouseLabel, "Chưa ghi")) +
      (children.length
        ? fieldRaw(
            "Con (" + children.length + ")",
            '<span class="person-link-list">' + children.map(personLink).join("") + "</span>",
            true,
          )
        : field("Con", "Chưa ghi")) +
      "</div></section>";

    if (socialRelations.length) {
      body +=
        '<section class="profile-section" aria-labelledby="section-social">' +
        '<h3 id="section-social">Quan hệ khác</h3><div class="profile-grid">' +
        fieldRaw(
          "Liên kết (" + socialRelations.length + ")",
          '<span class="person-link-list">' +
            socialRelations
              .map(function (relation) {
                var label = relation.label || relation.relation_type || "quan hệ khác";
                if (relation.related_id) {
                  return (
                    escapeHtml(label) +
                    ": " +
                    personLink({
                      id: relation.related_id,
                      name: relation.related_name,
                    })
                  );
                }
                return (
                  escapeHtml(label) +
                  ": " +
                  escapeHtml(relation.to_person_name || "Chưa rõ")
                );
              })
              .join("") +
            "</span>",
          true,
        ) +
        "</div></section>";
    }

    // Vẽ nhánh — chỉ khi người nằm trong bloodline cây chính
    var inBlood = bloodlineNodes.some(function (n) {
      return n.id === p.id;
    });
    if (inBlood) {
      var branchPeople = collectDescendants(p.id);
      var descendants = branchPeople.filter(function (person) {
        return person.id !== p.id;
      });
      var rootGeneration = Number(p.generation) || 0;
      var maxDescendantGeneration = branchPeople.reduce(function (max, person) {
        return Math.max(max, Number(person.generation) || max);
      }, rootGeneration);

      if (descendants.length) {
        var generationOptions =
          '<option value="">Tất cả con cháu (' +
          descendants.length +
          " người · đến Đời " +
          maxDescendantGeneration +
          ")</option>";
        for (var gen = rootGeneration + 1; gen <= maxDescendantGeneration; gen += 1) {
          generationOptions +=
            '<option value="' + gen + '">Đến Đời ' + gen + "</option>";
        }
        body +=
          '<section class="profile-section branch-builder" aria-labelledby="section-branch">' +
          '<h3 id="section-branch">Vẽ nhánh hậu duệ</h3>' +
          "<p>Chọn đời cuối cần xem. Mặc định lấy toàn bộ con cháu trong nhánh này.</p>" +
          '<div class="branch-builder-controls">' +
          '<select id="branchEndGeneration" class="branch-generation-select" data-root-key="' +
          escapeHtml(String(p.id)) +
          '" aria-label="Đời cuối của nhánh hậu duệ">' +
          generationOptions +
          "</select>" +
          '<button type="button" class="branch-draw-btn" id="btnDrawBranch">Vẽ phả đồ nhánh này</button>' +
          "</div></section>";
      } else {
        body +=
          '<section class="profile-section branch-builder" aria-labelledby="section-branch">' +
          '<h3 id="section-branch">Vẽ nhánh hậu duệ</h3>' +
          "<p>Người này chưa có con cháu trong dữ liệu phả đồ.</p></section>";
      }
    }

    if (p.notes) {
      body +=
        '<section class="profile-section" aria-labelledby="section-notes">' +
        '<h3 id="section-notes">Ghi chép gia phả</h3>' +
        '<p class="profile-note">' +
        escapeHtml(p.notes) +
        "</p></section>";
    }

    var adminMa = p.personCode || p.legacyId || p.id;
    body +=
      '<section class="profile-section profile-admin-actions" aria-labelledby="section-admin">' +
      '<h3 id="section-admin">Quản trị</h3>' +
      "<p>Phả đồ công khai chỉ xem. Muốn sửa hồ sơ / gắn cha mẹ / vợ chồng → mở Admin (cần đăng nhập Cloudflare Access).</p>" +
      '<div class="profile-admin-row">' +
      '<a class="btn-admin-edit" href="' +
      escapeHtml(ADMIN_URL + "/?ma=" + encodeURIComponent(adminMa)) +
      '" target="_blank" rel="noopener">Sửa hồ sơ trong Admin</a>' +
      "</div></section>";

    el("personModalBody").innerHTML = body;
    var drawBtn = el("btnDrawBranch");
    if (drawBtn) drawBtn.onclick = drawDescendantBranchFromModal;
  }

  function closePersonModal() {
    var modal = el("personModal");
    if (!modal) return;
    if (typeof modal.close === "function" && modal.open) modal.close();
    else modal.removeAttribute("open");
  }

  function initModal() {
    var modal = el("personModal");
    if (!modal || modal.dataset.ready === "true") return;
    modal.dataset.ready = "true";
    el("modalClose").onclick = closePersonModal;
    modal.addEventListener("click", function (event) {
      if (event.target === modal) closePersonModal();
      var link = event.target.closest ? event.target.closest(".person-link") : null;
      if (link && link.dataset.id) {
        focusOrOpen(link.dataset.id);
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && modal.open) {
        event.preventDefault();
        closePersonModal();
      }
    });
    modal.addEventListener("close", function () {
      if (personModalReturnFocus && typeof personModalReturnFocus.focus === "function") {
        personModalReturnFocus.focus();
      }
      personModalReturnFocus = null;
    });
  }

  // ── Controls ────────────────────────────────────────────────────
  function zoomToFit() {
    if (diagram) diagram.zoomToFit();
  }

  function setDiagramZoom(value) {
    if (!diagram) return;
    var scale = parseFloat(value);
    if (!scale) return;
    var center = diagram.viewportBounds.center;
    diagram.scale = scale;
    diagram.centerRect(new go.Rect(center.x, center.y, 1, 1));
  }

  function syncZoomSlider() {
    var slider = el("zoomSlider");
    if (!slider || !diagram) return;
    var s = Math.min(2, Math.max(0.2, diagram.scale));
    if (Math.abs(parseFloat(slider.value) - s) > 0.01) slider.value = s.toFixed(2);
  }

  function toggleDiagramControls() {
    var panel = el("dcPanel");
    var toggle = el("dcToggle");
    if (!panel) return;
    var willOpen = panel.hasAttribute("hidden");
    if (willOpen) {
      panel.removeAttribute("hidden");
      syncZoomSlider();
    } else {
      panel.setAttribute("hidden", "");
    }
    if (toggle) toggle.setAttribute("aria-expanded", String(willOpen));
  }

  function panDiagram(dx, dy) {
    if (!diagram) return;
    var vp = diagram.viewportBounds;
    diagram.position = new go.Point(
      diagram.position.x + dx * vp.width * 0.6,
      diagram.position.y + dy * vp.height * 0.6,
    );
  }

  function setMobilePane(pane) {
    var showControls = pane === "controls";
    document.body.classList.toggle("mobile-pane-controls", showControls);
    document.body.classList.toggle("mobile-pane-diagram", !showControls);
    var tabDiagram = el("tabDiagram");
    var tabControls = el("tabControls");
    if (tabDiagram) {
      tabDiagram.classList.toggle("is-active", !showControls);
      tabDiagram.setAttribute("aria-selected", String(!showControls));
    }
    if (tabControls) {
      tabControls.classList.toggle("is-active", showControls);
      tabControls.setAttribute("aria-selected", String(showControls));
    }
    if (!showControls && diagram) {
      requestAnimationFrame(function () {
        try {
          diagram.requestUpdate();
          if (initialViewPending) applyInitialView();
        } catch (err) {
          /* ignore */
        }
      });
    }
  }

  function exportAsImage() {
    if (!diagram) return;
    diagram.makeImageData({
      scale: 1.5,
      background: "white",
      returnType: "blob",
      callback: function (blob) {
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = "vu-toc-lang-chuong.png";
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }

  function downloadJSON() {
    if (!diagram || !diagram.model) return;
    var payload = {
      view: el("viewMode").value,
      layout: el("layoutMode").value,
      nodes: diagram.model.nodeDataArray,
      links:
        diagram.model instanceof go.GraphLinksModel ? diagram.model.linkDataArray : [],
      exportedAt: new Date().toISOString(),
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "vu-toc-tree.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function initControls() {
    el("btnFit").onclick = zoomToFit;
    el("btnFitPanel").onclick = zoomToFit;
    el("btnExport").onclick = exportAsImage;
    el("btnJson").onclick = downloadJSON;
    el("btnRoot").onclick = applyInitialView;
    el("btnShowFullTree").onclick = showFullTree;
    el("filterGeneration").onchange = filterByGeneration;
    el("viewMode").onchange = changeDataView;
    el("layoutMode").onchange = changeLayoutMode;
    el("zoomSlider").oninput = function () {
      setDiagramZoom(this.value);
    };
    el("dcToggle").onclick = toggleDiagramControls;
    el("tabControls").onclick = function () {
      setMobilePane("controls");
    };
    el("tabDiagram").onclick = function () {
      setMobilePane("diagram");
    };
    document.querySelector(".nav-pad").addEventListener("click", function (e) {
      var btn = e.target.closest("[data-pan]");
      if (!btn) return;
      var parts = btn.dataset.pan.split(",");
      panDiagram(Number(parts[0]), Number(parts[1]));
    });
  }

  // ── Boot ────────────────────────────────────────────────────────
  function boot() {
    initDiagram();
    initModal();
    initControls();

    fetch(API.tree)
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (payload) {
        treePayload = payload;
        (payload.nodes || []).forEach(function (n) {
          nodeById[n.id] = n;
        });
        buildBloodline();
        populateGenerationFilter();
        configureLayout("lineage");
        applyLineageView();
        updateStats();
        resetStage();
        initSearch();
      })
      .catch(function (err) {
        el("myDiagramDiv").innerHTML =
          '<div class="loading-msg" style="color:#b91c1c">❌ Lỗi tải phả đồ: ' +
          escapeHtml(err.message) +
          "</div>";
      });
  }

  // Expose for inline onclick compatibility if needed
  window.drawDescendantBranchFromModal = drawDescendantBranchFromModal;
  window.showFullTree = showFullTree;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
