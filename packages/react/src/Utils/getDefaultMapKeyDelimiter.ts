export default function getDefaultMapKeyDelimiter(currentIncarnateDelimiter?: string) {
    return currentIncarnateDelimiter === '.' ? '|' : '.';
}
