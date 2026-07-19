/* Vũ Tộc Làng Chuông — viewer parity với Trần Tộc, đọc /api/public */
(function () {
  "use strict";

  var API = {
    tree: "/api/public/tree",
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
  var bloodlineNodes = [];
  var nodeById = {};
  var branchViewRootKey = null;
  var activeBranch = null;
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
          openPerson(node.data.id);
        },
      },
      $(
        go.Shape,
        "RoundedRectangle",
        { parameter1: 8, strokeWidth: 2 },
        new go.Binding("fill", "generation", genFill),
        new go.Binding("stroke", "generation", genStroke),
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
            return t ? "Vợ: " + t : " ";
          }),
        ),
      ),
    );

    diagram.linkTemplate = $(
      go.Link,
      { routing: go.Link.Orthogonal, corner: 6, selectable: false },
      $(go.Shape, { strokeWidth: 1.5, stroke: "#9ca3af" }),
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

  function buildBloodline() {
    bloodlineNodes = (treePayload.nodes || [])
      .filter(function (n) {
        return n.lineageRole !== "spouse";
      })
      .map(function (n) {
        return Object.assign({}, n, { spouseText: spouseLabel(n) });
      });
  }

  function applyModel(nodes) {
    diagram.model = createTreeModel(nodes);
    applyFiltersVisibility();
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
    diagram.findTreeRoots().each(function (node) {
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
    var people = bloodlineNodes;
    var gens = people
      .map(function (p) {
        return Number(p.generation);
      })
      .filter(function (g) {
        return Number.isFinite(g);
      });
    el("totalPeople").textContent = String(
      (treePayload.metadata && treePayload.metadata.totalPeople) || people.length,
    );
    el("totalRelationships").textContent = String(
      people.filter(function (p) {
        return !!p.fatherId;
      }).length,
    );
    var branchCount =
      (treePayload.metadata && treePayload.metadata.totalBranches) ||
      (treePayload.branches || []).length;
    if (gens.length) {
      el("generationRange").textContent =
        branchCount + " chi · Đời " + Math.min.apply(null, gens) + "–" + Math.max.apply(null, gens);
    } else {
      el("generationRange").textContent = branchCount + " chi";
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

  function renderBranchFilter() {
    var wrap = el("branchFilter");
    wrap.innerHTML = "";
    var all = document.createElement("button");
    all.type = "button";
    all.textContent = "Tất cả";
    all.className = "active";
    all.onclick = function () {
      setBranch(null);
    };
    wrap.appendChild(all);
    (treePayload.branches || []).forEach(function (b) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "Chi " + b.number;
      btn.title = b.name;
      btn.dataset.branch = b.id;
      btn.onclick = function () {
        setBranch(b.id);
      };
      wrap.appendChild(btn);
    });
  }

  function setBranch(branchId) {
    activeBranch = branchId;
    el("branchFilter").querySelectorAll("button").forEach(function (btn) {
      var match =
        (branchId === null && !btn.dataset.branch) || btn.dataset.branch === branchId;
      btn.classList.toggle("active", match);
    });
    applyFiltersVisibility();
    if (branchId !== null) {
      var first = null;
      diagram.nodes.each(function (node) {
        if (!first && node.visible && node.data.branchId === branchId) first = node;
      });
      if (first) {
        diagram.select(first);
        diagram.commandHandler.scrollToPart(first);
      }
    }
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
      if (visible && activeBranch !== null && node.data.branchId !== activeBranch) {
        // Khi lọc chi: giữ tổ tiên ngoài chi nếu cần? Trần Tộc không có chi.
        // Vũ Tộc: làm mờ bằng visible=false các node ngoài chi (trừ khi đang xem nhánh hậu duệ).
        if (!branchViewRootKey) visible = false;
      }
      node.visible = visible;
    });
    diagram.links.each(function (link) {
      link.visible =
        !!(link.fromNode && link.toNode && link.fromNode.visible && link.toNode.visible);
    });
    diagram.commitTransaction("filter");
    diagram.layout.invalidateLayout();
    diagram.layoutDiagram(true);
  }

  function filterByGeneration() {
    applyFiltersVisibility();
  }

  function changeViewMode() {
    if (!diagram) return;
    var mode = el("viewMode").value;
    if (mode === "tree") {
      diagram.layout = $(go.TreeLayout, {
        angle: 90,
        layerSpacing: 50,
        nodeSpacing: 15,
        compaction: go.TreeLayout.CompactionBlock,
      });
    } else {
      diagram.layout = $(go.ForceDirectedLayout, {
        defaultSpringLength: 60,
        defaultElectricalCharge: 200,
      });
    }
  }

  // ── Branch / descendants ────────────────────────────────────────
  function collectDescendants(rootKey, endGeneration) {
    var all = bloodlineNodes;
    var root = all.find(function (p) {
      return String(p.id) === String(rootKey);
    });
    if (!root) return [];
    var childrenByFather = {};
    all.forEach(function (p) {
      if (!p.fatherId) return;
      var fk = String(p.fatherId);
      if (!childrenByFather[fk]) childrenByFather[fk] = [];
      childrenByFather[fk].push(p);
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
      (childrenByFather[key] || []).forEach(function (child) {
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
    activeBranch = null;
    el("branchFilter").querySelectorAll("button").forEach(function (btn) {
      btn.classList.toggle("active", !btn.dataset.branch);
    });
    closePersonModal();
    setMobilePane("diagram");
    requestAnimationFrame(function () {
      applyModel(people);
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
    });
  }

  function showFullTree() {
    if (!diagram || !bloodlineNodes.length) return;
    branchViewRootKey = null;
    applyModel(bloodlineNodes);
    var banner = el("branchViewBanner");
    if (banner) banner.setAttribute("hidden", "");
    el("filterGeneration").value = "";
    activeBranch = null;
    el("branchFilter").querySelectorAll("button").forEach(function (btn) {
      btn.classList.toggle("active", !btn.dataset.branch);
    });
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
    var node = diagram && diagram.findNodeForKey(id);
    if (!node && branchViewRootKey) {
      showFullTree();
      node = diagram.findNodeForKey(id);
    }
    if (node) {
      if (!node.visible) {
        node.visible = true;
      }
      diagram.select(node);
      diagram.commandHandler.scrollToPart(node);
    }
    openPerson(id);
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
    if (!treePayload) return;
    var blob = new Blob([JSON.stringify(treePayload, null, 2)], {
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
    el("viewMode").onchange = changeViewMode;
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
        applyModel(bloodlineNodes);
        renderBranchFilter();
        populateGenerationFilter();
        updateStats();
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
