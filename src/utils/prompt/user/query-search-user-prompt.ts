export const getUserPromptQuerySearchProduct = ({ text }: { text: string }) => {
    return `
USER INPUT
The following text represents what the user is looking for.
The input may be clear, vague, or incomplete.

Your task is to infer the user's SEARCH INTENT from this text
and find the most relevant products from the PRODUCT STORE.

text_user: "${text}"

---

INSTRUCTIONS
- Extract all meaningful search criteria from text_user.
- Query the PRODUCT STORE using File Search.
- Rank products by relevance according to the SYSTEM rules.
- Apply fallback logic if the input is vague or incomplete.
- Return ONLY products that are reasonably related to the user's intent.
- It is acceptable to return multiple products.

IMPORTANT
- If text_user is vague, prioritize higher-rated and well-balanced products.
- If no product exactly matches, return the closest relevant alternatives.
- Do NOT return an empty result unless the store has no related products at all.

OUTPUT REQUIREMENT
- Return ONLY JSON
- Follow the provided Response Schema strictly
`;
};
