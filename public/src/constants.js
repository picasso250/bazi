// src/constants.js

export const heavenlyStems = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"];
export const earthlyBranches = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"];

export const baziMonthDefs = [
    { name: "立春", longitude: 315, branch: "寅", roughMonth: 2, roughDay: 4 }, // Start of 寅月
    { name: "惊蛰", longitude: 345, branch: "卯", roughMonth: 3, roughDay: 6 }, // Start of 卯月
    { name: "清明", longitude: 15, branch: "辰", roughMonth: 4, roughDay: 5 }, // Start of 辰月
    { name: "立夏", longitude: 45, branch: "巳", roughMonth: 5, roughDay: 6 }, // Start of 巳月
    { name: "芒种", longitude: 75, branch: "午", roughMonth: 6, roughDay: 6 }, // Start of 午月
    { name: "小暑", longitude: 105, branch: "未", roughMonth: 7, roughDay: 7 }, // Start of 未月
    { name: "立秋", longitude: 135, branch: "申", roughMonth: 8, roughDay: 7 }, // Start of 申月
    { name: "白露", longitude: 165, branch: "酉", roughMonth: 9, roughDay: 8 }, // Start of 酉月
    { name: "寒露", longitude: 195, branch: "戌", roughMonth: 10, roughDay: 8 }, // Start of 戌月
    { name: "立冬", longitude: 225, branch: "亥", roughMonth: 11, roughDay: 7 }, // Start of 亥月
    { name: "大雪", longitude: 255, branch: "子", roughMonth: 12, roughDay: 7 }, // Start of 子月
    { name: "小寒", longitude: 285, branch: "丑", roughMonth: 1, roughDay: 6 }  // Start of 丑月 (Gregorian next year's Jan)
];

export const stemAttributes = {
    "甲": { element: "木", yinYang: "阳" },
    "乙": { element: "木", yinYang: "阴" },
    "丙": { element: "火", yinYang: "阳" },
    "丁": { element: "火", yinYang: "阴" },
    "戊": { element: "土", yinYang: "阳" },
    "己": { element: "土", yinYang: "阴" },
    "庚": { element: "金", yinYang: "阳" },
    "辛": { element: "金", yinYang: "阴" },
    "壬": { element: "水", yinYang: "阳" },
    "癸": { element: "水", yinYang: "阴" },
};

export const earthlyBranchHiddenStems = {
    "子": ["癸"],
    "丑": ["己", "癸", "辛"],
    "寅": ["甲", "丙", "戊"],
    "卯": ["乙"],
    "辰": ["戊", "乙", "癸"],
    "巳": ["丙", "庚", "戊"],
    "午": ["丁", "己"],
    "未": ["己", "丁", "乙"],
    "申": ["庚", "壬", "戊"],
    "酉": ["辛"],
    "戌": ["戊", "辛", "丁"],
    "亥": ["壬", "甲"],
};

export const produces = { "木": "火", "火": "土", "土": "金", "金": "水", "水": "木" };
export const controls = { "木": "土", "火": "金", "土": "水", "金": "木", "水": "火" };
