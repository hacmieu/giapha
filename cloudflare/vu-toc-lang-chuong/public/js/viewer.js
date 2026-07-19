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

  var ROLE_LABEL = {
    dinh: "Đinh",
    dinh_adopted: "Đinh nhập tộc",
    daughter: "Con gái",
    daughter_contributor: "Con gái đóng suất Đinh",
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

  function nodeFill(data) {
    if (data.lineageRole === "external") return "#faf5ff";
    if (data.lineageRole === "spouse") return "#fdf2f8";
    return genFill(data.generation);
  }

  function nodeStroke(data) {
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
    if (names.length === 1) return names[0];
    return names.length + " người";
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
              if (d.spouseText) lines.push("Vợ/Chồng: " + d.spouseText);
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
            height: 12,
            width: 104,
            maxLines: 1,
            overflow: go.TextBlock.OverflowEllipsis,
            font: "8pt Arial",
            stroke: "#6b7280",
            textAlign: "center",
            margin: new go.Margin(1, 0, 0, 0),
          },
          new go.Binding("text", "spouseText", function (t) {
            return t ? "Phối ngẫu: " + t : " ";
          }),
        ),
      ),
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
          return "#9ca3af";
        }),
        new go.Binding("strokeDashArray", "linkKind", function (kind) {
          return kind === "spouse" || kind === "social" ? [6, 4] : null;
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
      nodeDataArray: nodes.map(function (node) {
        return {
          id: node.id,
          name: node.name,
          gender: node.gender,
          generation: node.generation,
          lineageRole: node.lineageRole,
          treeScope: node.treeScope,
          isDeceased: node.isDeceased,
          spouseText: node.spouseText || "",
        };
      }),
      linkDataArray: links,
    });
  }

  function graphSpouseNames(personId) {
    if (!graphPayload) return "";
    var names = (graphPayload.spouseRelations || [])
      .filter(function (relation) {
        return relation.personAId === personId || relation.personBId === personId;
      })
      .map(function (relation) {
        var otherId =
          relation.personAId === personId ? relation.personBId : relation.personAId;
        return nodeById[otherId] ? nodeById[otherId].name : null;
      })
      .filter(Boolean);
    if (names.length === 1) return names[0];
    return names.length > 1 ? names.length + " người" : "";
  }

  function selectGraphData(view) {
    var allNodes = (graphPayload && graphPayload.nodes) || [];
    var selectedIds = {};

    if (view === "family") {
      allNodes.forEach(function (node) {
        if (node.treeScope === "main") selectedIds[node.id] = true;
      });
      // Thêm vợ/chồng trực tiếp của người trong main, kể cả người phối ngẫu là external.
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

    var nodes = allNodes
      .filter(function (node) {
        return selectedIds[node.id];
      })
      .map(function (node) {
        return Object.assign({}, node, { spouseText: graphSpouseNames(node.id) });
      });
    var links = [];

    (graphPayload.parentRelations || []).forEach(function (relation) {
      if (selectedIds[relation.parentId] && selectedIds[relation.childId]) {
        links.push({
          id: "parent:" + relation.id,
          from: relation.parentId,
          to: relation.childId,
          linkKind: relation.relationType,
          label: relation.relationType === "mother" ? "mẹ" : "",
        });
      }
    });
    (graphPayload.spouseRelations || []).forEach(function (relation) {
      if (selectedIds[relation.personAId] && selectedIds[relation.personBId]) {
        links.push({
          id: "spouse:" + relation.id,
          from: relation.personAId,
          to: relation.personBId,
          linkKind: "spouse",
          label: relation.wifeOrder ? "vợ thứ " + relation.wifeOrder : "vợ/chồng",
        });
      }
    });

    if (view === "relations") {
      (graphPayload.socialRelations || []).forEach(function (relation) {
        var targetId = relation.toPersonId;
        if (!targetId && relation.toPersonName) {
          targetId = "social-target:" + relation.id;
          nodes.push({
            id: targetId,
            name: relation.toPersonName,
            gender: relation.toPersonGender || "male",
            generation: null,
            lineageRole: "external",
            treeScope: "external",
            isDeceased: false,
            spouseText: "",
          });
          selectedIds[targetId] = true;
        }
        if (targetId && selectedIds[relation.fromPersonId] && selectedIds[targetId]) {
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

    return { nodes: nodes, links: links };
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

  function applyTreeModel(nodes) {
    currentViewNodes = nodes;
    diagram.model = createTreeModel(nodes);
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
      diagram.layout = $(go.LayeredDigraphLayout, {
        direction: 90,
        layerSpacing: 55,
        columnSpacing: 20,
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
      currentViewNodes = bloodlineNodes;
      diagram.model = createTreeModel(bloodlineNodes);
    } else {
      var data = selectGraphData(view);
      currentViewNodes = data.nodes;
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
      var d = node.data;
      var gen = d.generation == null ? 99 : Number(d.generation);
      var isDinh = d.lineageRole === "dinh" || d.lineageRole === "dinh_adopted";
      var size = 0;
      node.findTreeParts().each(function () {
        size += 1;
      });
      var score = (isDinh ? 100000 : 0) - gen * 1000 + size;
      if (score > bestScore) {
        bestScore = score;
        best = node;
      }
    });
    if (best) {
      var vb = diagram.viewportBounds;
      diagram.position = new go.Point(
        best.actualBounds.centerX - vb.width / 2,
        best.actualBounds.y - 24,
      );
      diagram.select(best);
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
      var visible = true;
      if (maxGenNum !== null && node.data.generation != null) {
        visible = Number(node.data.generation) <= maxGenNum;
      }
      node.visible = visible;
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
      applyTreeModel(people);
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
            "Phối ngẫu",
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
        : field("Phối ngẫu", "Chưa ghi")) +
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
        applyTreeModel(bloodlineNodes);
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
