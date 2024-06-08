export function pascalToKebabCase(str: string) {
    return str
        .replace(/([a-z])([A-Z])/g, "$1-$2") // 소문자와 대문자 사이에 하이픈 추가
        .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2") // 두 대문자 사이에 하이픈 추가
        .toLowerCase(); // 전체를 소문자로 변환
}
