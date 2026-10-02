// Parser for A0207S 個人資料查詢 (wrapper over ../A02/A0207?Page.aspx).
//
// The upstream renders a read-only form; every field lives in inputs/selects
// whose names are prefixed with the page's module id (A0207A:). The prefix
// differs from the menu code, so lookups match on the name suffix only.

import { inputValue, selectValue } from "./html";

export type ProfileGroup = {
  title: string;
  fields: Array<{ label: string; value: string }>;
};

export type Profile = {
  studentId: string;
  name: string;
  groups: ProfileGroup[];
};

export function parseProfile(html: string): Profile {
  const studentId = inputValue(html, "txtSTUDENT_ID");
  const name = inputValue(html, "txtSTD_CNAME");

  const birth = formatRocDate(inputValue(html, "txtBIRTH_DT"));
  const enrolled = formatRocDate(inputValue(html, "txtVRF_DT"));
  const regAddress = joinAddress(inputValue(html, "txtREG_ZIP"), inputValue(html, "txtREG_ADDR"));
  const nowAddress = joinAddress(inputValue(html, "txtNOW_ZIP"), inputValue(html, "txtNOW_ADDR"));

  const groups: ProfileGroup[] = [
    {
      title: "學籍",
      fields: compact([
        ["學號", studentId],
        ["姓名", name],
        ["英文姓名", inputValue(html, "txtSTD_ENAME")],
        ["性別", optionLabel(selectValue(html, "ddlSEX_M"))],
        ["出生年月日", birth],
        ["身分證字號", inputValue(html, "txtIDNO")],
        ["學籍目前狀態", optionLabel(selectValue(html, "ddlNOW_M"))],
        ["學生身分別", optionLabel(selectValue(html, "ddlSTDTP_M"))],
        ["費用別", optionLabel(selectValue(html, "ddlFEE_NOW_M"))],
        ["國籍", selectValue(html, "ddlNATIONALITY_M")],
        ["核准入學日期", enrolled],
      ]),
    },
    {
      title: "聯絡資料",
      fields: compact([
        ["電子信箱", inputValue(html, "txtEMAIL")],
        ["行動電話", inputValue(html, "txtMOBILE_TEL")],
        ["電話", inputValue(html, "txtNOW_TEL")],
        ["通訊地址", nowAddress],
        ["戶籍地址", regAddress],
        ["戶籍電話", inputValue(html, "txtREG_TEL")],
      ]),
    },
    {
      title: "緊急聯絡人",
      fields: compact([
        ["聯絡人", inputValue(html, "txtURGENT_MAN")],
        ["電話", inputValue(html, "txtURGENT_TEL")],
        ["行動電話", inputValue(html, "txtURGENT_MOBILE")],
      ]),
    },
    {
      title: "住宿",
      fields: compact([["宿舍房號", inputValue(html, "txtROOM")]]),
    },
  ];

  return { studentId, name, groups: groups.filter((group) => group.fields.length > 0) };
}

function compact(pairs: Array<[string, string]>): ProfileGroup["fields"] {
  return pairs
    .filter(([, value]) => value)
    .map(([label, value]) => ({ label, value }));
}

function joinAddress(zip: string, address: string): string {
  return [zip, address].filter(Boolean).join(" ");
}

/** Upstream dates are 民國 yymmdd ("940421") or yyyymmdd ("0940421"). */
function formatRocDate(raw: string): string {
  const match = /^(\d{2,3})(\d{2})(\d{2})$/.exec(raw);
  if (!match) return raw;
  const year = Number(match[1]) + 1911;
  return `${year}-${match[2]}-${match[3]}`;
}

/** Selected options carry their code prefix ("1.男", "01.一般生"). */
function optionLabel(raw: string): string {
  return raw.replace(/^\d+\./, "").trim();
}
