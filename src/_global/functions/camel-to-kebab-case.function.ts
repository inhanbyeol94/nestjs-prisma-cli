export function camelToKebabCase(str: string) {
    return str
        .replace(/([a-z])([A-Z])/g, "$1-$2") // 소문자와 대문자 사이에 하이픈 추가
        .toLowerCase();
}
