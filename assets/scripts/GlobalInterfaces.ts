// Định nghĩa các interface cho dữ liệu toàn cục

export class AwardItemInfo {
    CfgId: number;
    Num: number;
}

export class ExplainViewData {
    mianTitle: string;
    titleLargen: string;
    passagesDatas: PassagesData[];
}

export class PassagesData {
    title: string;
    note: string;
    content: string;
}