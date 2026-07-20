/* Admin CRUD MVP — Vũ Tộc Làng Chuông · gắn nhánh theo Mã */
(function () {
  "use strict";

  var API = {
    health: "/api/health",
    meta: "/api/admin/meta",
    people: "/api/admin/people",
    resolve: "/api/admin/people/resolve",
    person: function (id) {
      return "/api/admin/people/" + encodeURIComponent(id);
    },
    parents: "/api/admin/parent-relations",
    spouses: "/api/admin/spouse-relations",
  };

  var state = {
    selectedId: null,
    selectedLegacyId: null,
    selectedVersion: null,
    branches: [],
  };

  function el(id) {
    return document.getElementById(id);
  }

  function setBanner(kind, text) {
    var banner = el("statusBanner");
    banner.className = "banner " + (kind || "warn");
    banner.textContent = text;
  }

  function api(url, options) {
    options = options || {};
    var headers = Object.assign(
      { Accept: "application/json" },
      options.headers || {},
    );
    var body = options.body;
    if (body != null && typeof body !== "string") {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(body);
    }
    return fetch(url, {
      method: options.method || "GET",
      headers: headers,
      body: body,
      credentials: "same-origin",
    }).then(function (response) {
      return response.text().then(function (text) {
        var data = null;
        try {
          data = text ? JSON.parse(text) : null;
        } catch (err) {
          data = { raw: text };
        }
        if (!response.ok) {
          var message =
            (data && data.error && data.error.message) ||
            "HTTP " + response.status;
          var error = new Error(message);
          error.status = response.status;
          error.code = data && data.error && data.error.code;
          error.payload = data;
          throw error;
        }
        return data;
      });
    });
  }

  function displayMa(person) {
    return (
      person.legacyId ||
      person.legacy_id ||
      person.personCode ||
      person.person_code ||
      person.id ||
      ""
    );
  }

  function fillBranches(branches) {
    state.branches = branches || [];
    var select = el("branchId");
    select.innerHTML = '<option value="">— Không gán chi —</option>';
    state.branches.forEach(function (branch) {
      var opt = document.createElement("option");
      opt.value = branch.id;
      opt.textContent = "Chi " + branch.number + " · " + branch.name;
      select.appendChild(opt);
    });
  }

  function clearPersonForm() {
    state.selectedId = null;
    state.selectedLegacyId = null;
    state.selectedVersion = null;
    el("personFormTitle").textContent = "Hồ sơ mới";
    el("personId").value = "";
    el("personVersion").value = "";
    el("name").value = "";
    el("legacyIdDisplay").value = "";
    el("gender").value = "male";
    el("lineageRole").value = "dinh";
    el("treeScope").value = "main";
    el("memberType").value = "blood";
    el("branchId").value = "";
    el("generation").value = "";
    el("birthOrder").value = "";
    el("birthDate").value = "";
    el("deathDate").value = "";
    el("deathDateLunar").value = "";
    el("personCode").value = "";
    el("isDinh").checked = true;
    el("isDeceased").checked = false;
    el("notes").value = "";
    el("btnDelete").disabled = true;
    el("btnPromoteMain").disabled = true;
    el("attachChildMa").value = "";
    el("spouseA").value = "";
    el("parentChildId").value = "";
    document.querySelectorAll(".item.active").forEach(function (node) {
      node.classList.remove("active");
    });
  }

  function loadPersonIntoForm(person) {
    var ma = displayMa(person);
    state.selectedId = person.id;
    state.selectedLegacyId = ma;
    state.selectedVersion = person.version || 1;
    el("personFormTitle").textContent = "Sửa · " + (person.name || person.id);
    el("personId").value = person.id;
    el("personVersion").value = String(person.version || 1);
    el("name").value = person.name || "";
    el("legacyIdDisplay").value = person.legacyId || person.legacy_id || "";
    el("gender").value = person.gender || "male";
    el("lineageRole").value = person.lineageRole || "dinh";
    el("treeScope").value = person.treeScope || "main";
    el("memberType").value = person.memberType || "blood";
    el("branchId").value = person.branchId || "";
    el("generation").value =
      person.generation == null ? "" : String(person.generation);
    el("birthOrder").value =
      person.birthOrder == null ? "" : String(person.birthOrder);
    el("birthDate").value = person.birthDate || "";
    el("deathDate").value = person.deathDate || "";
    el("deathDateLunar").value = person.deathDateLunar || "";
    el("personCode").value = person.personCode || "";
    el("isDinh").checked = Boolean(person.isDinh);
    el("isDeceased").checked = Boolean(person.isDeceased);
    el("notes").value = person.notes || "";
    el("btnDelete").disabled = false;
    el("btnPromoteMain").disabled = person.treeScope === "main";
    el("attachChildMa").value = ma;
    el("spouseA").value = ma;
    el("parentChildId").value = ma;
    if (person.generation != null && !el("attachGeneration").value) {
      el("attachGeneration").value = String(person.generation);
    }
  }

  function renderPeople(results) {
    var list = el("peopleList");
    list.innerHTML = "";
    if (!results || !results.length) {
      list.innerHTML =
        '<div style="padding:12px;color:#64748b">Không có kết quả.</div>';
      return;
    }
    results.forEach(function (person) {
      var button = document.createElement("button");
      button.type = "button";
      button.className =
        "item" + (person.id === state.selectedId ? " active" : "");
      var ma = displayMa(person);
      button.innerHTML =
        "<strong>" +
        escapeHtml(person.name) +
        "</strong><small>" +
        escapeHtml(
          [
            "Mã " + ma,
            person.treeScope,
            person.lineageRole,
            person.generation != null ? "Đời " + person.generation : null,
          ]
            .filter(Boolean)
            .join(" · "),
        ) +
        "</small>";
      button.onclick = function () {
        loadPersonIntoForm(person);
        renderPeople(results);
      };
      list.appendChild(button);
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
          c
        ] || c
      );
    });
  }

  function optionalNumber(id) {
    var raw = el(id).value.trim();
    if (!raw) return null;
    var n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }

  function personPayload() {
    return {
      name: el("name").value.trim(),
      gender: el("gender").value,
      lineageRole: el("lineageRole").value,
      treeScope: el("treeScope").value,
      memberType: el("memberType").value,
      branchId: el("branchId").value || null,
      generation: optionalNumber("generation"),
      birthOrder: optionalNumber("birthOrder"),
      birthDate: el("birthDate").value.trim(),
      deathDate: el("deathDate").value.trim(),
      deathDateLunar: el("deathDateLunar").value.trim(),
      personCode: el("personCode").value.trim() || null,
      isDinh: el("isDinh").checked,
      isDeceased: el("isDeceased").checked,
      notes: el("notes").value,
      visibility: "public",
    };
  }

  function normalizePerson(person) {
    return {
      id: person.id,
      legacyId: person.legacyId != null ? person.legacyId : person.legacy_id,
      name: person.name,
      gender: person.gender,
      lineageRole: person.lineageRole || person.lineage_role,
      treeScope: person.treeScope || person.tree_scope,
      memberType: person.memberType || person.member_type,
      branchId: person.branchId != null ? person.branchId : person.branch_id,
      generation: person.generation,
      birthOrder:
        person.birthOrder != null ? person.birthOrder : person.birth_order,
      birthDate: person.birthDate != null ? person.birthDate : person.birth_date,
      deathDate: person.deathDate != null ? person.deathDate : person.death_date,
      deathDateLunar:
        person.deathDateLunar != null
          ? person.deathDateLunar
          : person.death_date_lunar,
      personCode:
        person.personCode != null ? person.personCode : person.person_code,
      isDinh: person.isDinh != null ? person.isDinh : Boolean(person.is_dinh),
      isDeceased:
        person.isDeceased != null
          ? person.isDeceased
          : Boolean(person.is_deceased),
      notes: person.notes || "",
      version: person.version,
    };
  }

  function searchPeople() {
    var q = el("searchQ").value.trim();
    var scope = el("searchScope").value;
    var params = new URLSearchParams();
    if (q) params.set("q", q);
    if (scope) params.set("treeScope", scope);
    params.set("limit", "80");
    setBanner("warn", "Đang tải danh sách…");
    return api(API.people + "?" + params.toString())
      .then(function (data) {
        renderPeople(data.results || []);
        setBanner(
          "ok",
          "Tìm thấy " +
            (data.results || []).length +
            " người · Access/API sẵn sàng.",
        );
      })
      .catch(showApiError);
  }

  function showApiError(error) {
    if (error.status === 401 || error.code === "access_token_missing") {
      setBanner(
        "error",
        "Chưa có Cloudflare Access JWT. Hãy mở lại trang qua Access login (email được phép).",
      );
      return;
    }
    if (error.status === 503 || error.code === "access_not_configured") {
      setBanner(
        "error",
        "Access chưa cấu hình AUD/team domain trên Worker admin.",
      );
      return;
    }
    setBanner("error", error.message || "Lỗi API");
  }

  function savePerson() {
    var payload = personPayload();
    if (!payload.name) {
      setBanner("error", "Họ tên bắt buộc.");
      return;
    }
    var id = el("personId").value;
    var req;
    if (id) {
      payload.version = Number(el("personVersion").value);
      req = api(API.person(id), { method: "PATCH", body: payload });
    } else {
      req = api(API.people, { method: "POST", body: payload });
    }
    setBanner("warn", "Đang lưu…");
    req
      .then(function (data) {
        var normalized = normalizePerson(data.person);
        loadPersonIntoForm(normalized);
        setBanner("ok", "Đã lưu · version " + normalized.version);
        el("searchQ").value = normalized.name;
        return searchPeople();
      })
      .catch(showApiError);
  }

  function deletePerson() {
    var id = el("personId").value;
    if (!id) return;
    if (!window.confirm("Xóa mềm hồ sơ này?")) return;
    var version = Number(el("personVersion").value);
    setBanner("warn", "Đang xóa…");
    api(API.person(id), {
      method: "DELETE",
      body: { version: version },
    })
      .then(function () {
        clearPersonForm();
        setBanner("ok", "Đã xóa mềm.");
        return searchPeople();
      })
      .catch(showApiError);
  }

  function promoteToMain() {
    var id = el("personId").value;
    if (!id) {
      setBanner("error", "Chọn hồ sơ trước.");
      return;
    }
    var payload = personPayload();
    payload.treeScope = "main";
    if (payload.lineageRole === "external") {
      payload.lineageRole = payload.gender === "male" ? "dinh" : "daughter";
    }
    payload.version = Number(el("personVersion").value);
    setBanner("warn", "Đang đưa lên cây chính…");
    api(API.person(id), { method: "PATCH", body: payload })
      .then(function (data) {
        var normalized = normalizePerson(data.person);
        loadPersonIntoForm(normalized);
        setBanner("ok", "Đã đưa lên cây chính · Mã " + displayMa(normalized));
        return searchPeople();
      })
      .catch(showApiError);
  }

  function resolveRef(ref) {
    var params = new URLSearchParams();
    params.set("ma", ref);
    return api(API.resolve + "?" + params.toString()).then(function (data) {
      return data.person;
    });
  }

  function resolveParentMa() {
    var parentMa = el("attachParentMa").value.trim();
    if (!parentMa) {
      setBanner("error", "Nhập Mã cha/mẹ trên cây chính.");
      return;
    }
    setBanner("warn", "Đang kiểm tra Mã…");
    resolveRef(parentMa)
      .then(function (person) {
        var scope = person.treeScope || person.tree_scope;
        setBanner(
          scope === "main" ? "ok" : "warn",
          "Mã " +
            displayMa(person) +
            " · " +
            person.name +
            " · phạm vi=" +
            scope +
            (scope === "main" ? " (OK gắn nhánh)" : " (chưa phải cây chính)"),
        );
      })
      .catch(showApiError);
  }

  function attachByMa() {
    var childMa = el("attachChildMa").value.trim();
    var parentMa = el("attachParentMa").value.trim();
    var relationType = el("attachRelationType").value;
    var promote = el("attachPromote").value === "main";
    var generation = optionalNumber("attachGeneration");

    if (!childMa || !parentMa) {
      setBanner("error", "Cần Mã con và Mã cha/mẹ.");
      return;
    }

    setBanner("warn", "Đang gắn nhánh theo Mã…");
    api(API.parents, {
      method: "POST",
      body: {
        childId: childMa,
        parentId: parentMa,
        relationType: relationType,
      },
    })
      .then(function () {
        if (!promote) {
          setBanner(
            "ok",
            "Đã gắn " +
              relationType +
              ": con " +
              childMa +
              " ← cha/mẹ " +
              parentMa +
              ".",
          );
          return null;
        }
        return resolveRef(childMa).then(function (child) {
          var role = child.lineageRole || child.lineage_role;
          var payload = {
            treeScope: "main",
            lineageRole:
              role === "external"
                ? child.gender === "male"
                  ? "dinh"
                  : "daughter"
                : role,
            version: child.version,
          };
          if (generation != null) {
            payload.generation = generation;
          }
          return api(API.person(child.id), {
            method: "PATCH",
            body: payload,
          }).then(function (data) {
            var normalized = normalizePerson(
              Object.assign({}, child, data.person, {
                legacyId: child.legacyId || child.legacy_id,
              }),
            );
            loadPersonIntoForm(normalized);
            setBanner(
              "ok",
              "Đã gắn " +
                relationType +
                " và đưa lên cây chính · Mã " +
                displayMa(normalized) +
                (normalized.generation != null
                  ? " · Đời " + normalized.generation
                  : ""),
            );
            el("searchQ").value = childMa;
            return searchPeople();
          });
        });
      })
      .catch(showApiError);
  }

  function addParent() {
    var body = {
      childId: el("parentChildId").value.trim(),
      parentId: el("parentParentId").value.trim(),
      relationType: el("parentRelationType").value,
    };
    setBanner("warn", "Đang thêm quan hệ cha/mẹ…");
    api(API.parents, { method: "POST", body: body })
      .then(function () {
        setBanner("ok", "Đã thêm quan hệ " + body.relationType + ".");
      })
      .catch(showApiError);
  }

  function addSpouse() {
    var body = {
      personAId: el("spouseA").value.trim(),
      personBId: el("spouseB").value.trim(),
      wifePersonId: el("wifePersonId").value.trim() || null,
      wifeOrder: optionalNumber("wifeOrder"),
      status: "married",
    };
    setBanner("warn", "Đang thêm phối ngẫu…");
    api(API.spouses, { method: "POST", body: body })
      .then(function () {
        setBanner("ok", "Đã thêm phối ngẫu.");
      })
      .catch(showApiError);
  }

  function boot() {
    el("searchQ").placeholder = "Tên hoặc Mã (vd django:389)…";
    el("btnSearch").onclick = searchPeople;
    el("btnNew").onclick = clearPersonForm;
    el("btnSave").onclick = savePerson;
    el("btnDelete").onclick = deletePerson;
    el("btnPromoteMain").onclick = promoteToMain;
    el("btnAttach").onclick = attachByMa;
    el("btnResolveParent").onclick = resolveParentMa;
    el("btnAddParent").onclick = addParent;
    el("btnAddSpouse").onclick = addSpouse;
    el("searchQ").addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        searchPeople();
      }
    });

    api(API.health)
      .then(function (health) {
        setBanner(
          "warn",
          "Worker mode=" +
            health.mode +
            " · Đang tải meta admin (cần Access JWT)…",
        );
        return api(API.meta);
      })
      .then(function (meta) {
        fillBranches(meta.branches || []);
        setBanner(
          "ok",
          "Admin sẵn sàng · " +
            ((meta.metadata && meta.metadata.totalPeople) || "?") +
            " người trong D1 · gắn nhánh bằng Mã.",
        );
        return searchPeople();
      })
      .catch(showApiError);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
