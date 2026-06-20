export class DocumentEditor {
    static async replaceSelection(newText: string) {
        await Word.run(async (context) => {
            const range = context.document.getSelection();
            range.insertText(newText, Word.InsertLocation.replace);
            await context.sync();
        });
    }

    static async replaceCurrentParagraph(newText: string) {
        await Word.run(async (context) => {
            const range = context.document.getSelection();
            const paragraph = range.paragraphs.getFirst();
            paragraph.insertText(newText, Word.InsertLocation.replace);
            await context.sync();
        });
    }

    static async replaceSearchTerm(searchTerm: string, newText: string) {
        await Word.run(async (context) => {
            const searchResults = context.document.body.search(searchTerm, { matchCase: false });
            context.load(searchResults, 'items');
            await context.sync();

            if (searchResults.items.length > 0) {
                // Replace only the first occurrence to be safe
                searchResults.items[0].insertText(newText, Word.InsertLocation.replace);
                await context.sync();
            }
        });
    }

    static async replaceHeadingContent(headingText: string, newText: string) {
        await Word.run(async (context) => {
            // Find the heading first
            const searchResults = context.document.body.search(headingText, { matchCase: false });
            context.load(searchResults, 'items');
            await context.sync();

            if (searchResults.items.length > 0) {
                const headingRange = searchResults.items[0];
                const headingParagraph = headingRange.paragraphs.getFirst();
                
                // Get the next paragraph after the heading
                const nextParagraph = headingParagraph.getNextOrNullObject();
                context.load(nextParagraph);
                await context.sync();

                if (!nextParagraph.isNullObject) {
                    nextParagraph.insertText(newText, Word.InsertLocation.replace);
                    await context.sync();
                }
            }
        });
    }

    static async getDocumentContext() {
        return await Word.run(async (context) => {
            const selection = context.document.getSelection();
            context.load(selection, 'text');
            
            const paragraph = selection.paragraphs.getFirstOrNullObject();
            context.load(paragraph, 'text');
            
            await context.sync();

            return {
                selectionText: selection.text || "",
                paragraphText: !paragraph.isNullObject ? paragraph.text : ""
            };
        }).catch(() => {
            return { selectionText: "", paragraphText: "" };
        });
    }
}
