/**
 * Service to strip images from design JSON before AI processing
 * and restore them afterwards to save tokens
 */

export interface ImageReference {
    path: string[];           // Path to the node (e.g., [0, 'children', 2, 'fills', 0])
    imageHash: string;        // The imageHash to preserve
    imageData: string;        // The base64 image data
    scaleMode?: string;       // Any other image properties
}

export interface ImageStripResult {
    cleanedDesign: any;       // Design JSON without images
    imageReferences: ImageReference[];  // Extracted images with their paths
}

export class ImageOptimizerService {
    /**
     * Strips all images from design JSON and stores references
     * @param design - The complete design JSON array
     * @returns Object with cleaned design and image references
     */
    stripImages(design: any[]): ImageStripResult {
        const imageReferences: ImageReference[] = [];
        
        // Deep clone to avoid mutating original
        const cleanedDesign = JSON.parse(JSON.stringify(design));
        
        // Recursively process the design to find and extract images
        this.processNode(cleanedDesign, [], imageReferences);
        
        console.log(`📸 Stripped ${imageReferences.length} images from design`);
        console.log(`📉 Token reduction: ~${this.estimateTokenSavings(imageReferences)} tokens saved`);
        
        return {
            cleanedDesign,
            imageReferences
        };
    }
    
    /**
     * Restores images to their original locations in the modified design
     * @param modifiedDesign - The design JSON returned from AI
     * @param imageReferences - The extracted image references
     * @returns Design with images restored
     */
    restoreImages(modifiedDesign: any[], imageReferences: ImageReference[]): any[] {
        // Deep clone to avoid mutating input
        const restoredDesign = JSON.parse(JSON.stringify(modifiedDesign));
        
        let restoredCount = 0;
        
        // Restore each image to its path
        for (const imageRef of imageReferences) {
            const restored = this.restoreImageAtPath(restoredDesign, imageRef);
            if (restored) {
                restoredCount++;
            }
        }
        
        console.log(`📸 Restored ${restoredCount}/${imageReferences.length} images to modified design`);
        
        return restoredDesign;
    }
    
    /**
     * Recursively processes nodes to find and extract IMAGE fills
     */
    private processNode(node: any, currentPath: any[], imageReferences: ImageReference[]): void {
        if (!node || typeof node !== 'object') {
            return;
        }
        
        // Handle arrays (like design root or children arrays)
        if (Array.isArray(node)) {
            node.forEach((item, index) => {
                this.processNode(item, [...currentPath, index], imageReferences);
            });
            return;
        }
        
        // Check if this node has fills with images
        if (node.fills && Array.isArray(node.fills)) {
            node.fills.forEach((fill: any, fillIndex: number) => {
                if (fill.type === 'IMAGE' && fill.imageData) {
                    // Extract image reference
                    const imagePath = [...currentPath, 'fills', fillIndex];
                    
                    imageReferences.push({
                        path: imagePath,
                        imageHash: fill.imageHash || '',
                        imageData: fill.imageData,
                        scaleMode: fill.scaleMode
                    });
                    
                    // Remove imageData from the fill (keep imageHash for reference)
                    delete fill.imageData;
                    
                    // Mark this as a stripped image fill
                    fill._imageStripped = true;
                }
            });
        }
        
        // Recursively process children
        if (node.children && Array.isArray(node.children)) {
            this.processNode(node.children, [...currentPath, 'children'], imageReferences);
        }
        
        // Process any other nested objects
        for (const key in node) {
            if (key !== 'fills' && key !== 'children' && typeof node[key] === 'object') {
                this.processNode(node[key], [...currentPath, key], imageReferences);
            }
        }
    }
    
    /**
     * Restores a single image to its path in the design
     */
    private restoreImageAtPath(design: any, imageRef: ImageReference): boolean {
        try {
            let current: any = design;
            
            // Navigate to the parent of the fill object
            for (let i = 0; i < imageRef.path.length - 1; i++) {
                const key = imageRef.path[i];
                if (current[key] === undefined) {
                    // Path doesn't exist in modified design - try to find matching node
                    console.warn(`Path not found: ${imageRef.path.join('.')}, attempting smart match`);
                    return this.smartRestoreImage(design, imageRef);
                }
                current = current[key];
            }
            
            // Get the fill index
            const fillIndex = imageRef.path[imageRef.path.length - 1];
            
            // Check if fill exists at this index
            if (!current[fillIndex]) {
                console.warn(`Fill not found at index ${fillIndex}, attempting smart match`);
                return this.smartRestoreImage(design, imageRef);
            }
            
            const fill = current[fillIndex];
            
            // Verify this is still an IMAGE fill
            if (fill.type === 'IMAGE' && fill._imageStripped === true) {
                fill.imageData = imageRef.imageData;
                if (imageRef.scaleMode) {
                    fill.scaleMode = imageRef.scaleMode;
                }
                delete fill._imageStripped;
                return true;
            } else if (fill.type === 'IMAGE' && fill.imageHash === imageRef.imageHash) {
                // Match by imageHash
                fill.imageData = imageRef.imageData;
                if (imageRef.scaleMode) {
                    fill.scaleMode = imageRef.scaleMode;
                }
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`Failed to restore image at path ${imageRef.path.join('.')}:`, error);
            return false;
        }
    }
    
    /**
     * Smart restore: tries to find the image by matching imageHash across the design
     * Used when the exact path has changed due to AI modifications
     */
    private smartRestoreImage(design: any, imageRef: ImageReference): boolean {
        const found = this.findImageFillByHash(design, imageRef.imageHash);
        
        if (found && found.fill) {
            found.fill.imageData = imageRef.imageData;
            if (imageRef.scaleMode) {
                found.fill.scaleMode = imageRef.scaleMode;
            }
            delete found.fill._imageStripped;
            console.log(`✅ Smart restored image with hash ${imageRef.imageHash}`);
            return true;
        }
        
        console.warn(`❌ Could not restore image with hash ${imageRef.imageHash}`);
        return false;
    }
    
    /**
     * Finds an IMAGE fill by its imageHash
     */
    private findImageFillByHash(node: any, imageHash: string): { fill: any } | null {
        if (!node || typeof node !== 'object') {
            return null;
        }
        
        // Handle arrays
        if (Array.isArray(node)) {
            for (const item of node) {
                const found = this.findImageFillByHash(item, imageHash);
                if (found) return found;
            }
            return null;
        }
        
        // Check fills
        if (node.fills && Array.isArray(node.fills)) {
            for (const fill of node.fills) {
                if (fill.type === 'IMAGE' && 
                    (fill.imageHash === imageHash || fill._imageStripped === true)) {
                    return { fill };
                }
            }
        }
        
        // Recursively search children
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                const found = this.findImageFillByHash(child, imageHash);
                if (found) return found;
            }
        }
        
        // Search other nested objects
        for (const key in node) {
            if (typeof node[key] === 'object') {
                const found = this.findImageFillByHash(node[key], imageHash);
                if (found) return found;
            }
        }
        
        return null;
    }
    
    /**
     * Estimates token savings from stripping images
     * Base64 images are roughly 4/3 the size of original, and ~4 chars per token
     */
    private estimateTokenSavings(imageReferences: ImageReference[]): number {
        let totalChars = 0;
        for (const ref of imageReferences) {
            totalChars += ref.imageData.length;
        }
        // Rough estimate: 4 characters per token
        return Math.floor(totalChars / 4);
    }
    
    /**
     * Validates that an image strip/restore cycle preserves data
     * Useful for testing
     */
    validateRoundTrip(original: any[], imageReferences: ImageReference[], restored: any[]): boolean {
        const originalImages = this.extractAllImageData(original);
        const restoredImages = this.extractAllImageData(restored);
        
        if (originalImages.length !== restoredImages.length) {
            console.error(`Image count mismatch: ${originalImages.length} vs ${restoredImages.length}`);
            return false;
        }
        
        const mismatches = originalImages.filter(orig => 
            !restoredImages.some(rest => rest === orig)
        );
        
        if (mismatches.length > 0) {
            console.error(`${mismatches.length} images not properly restored`);
            return false;
        }
        
        return true;
    }
    
    /**
     * Extracts all imageData from a design for validation
     */
    private extractAllImageData(design: any): string[] {
        const images: string[] = [];
        
        const extract = (node: any) => {
            if (!node || typeof node !== 'object') return;
            
            if (Array.isArray(node)) {
                node.forEach(item => extract(item));
                return;
            }
            
            if (node.fills && Array.isArray(node.fills)) {
                node.fills.forEach((fill: any) => {
                    if (fill.type === 'IMAGE' && fill.imageData) {
                        images.push(fill.imageData);
                    }
                });
            }
            
            for (const key in node) {
                if (typeof node[key] === 'object') {
                    extract(node[key]);
                }
            }
        };
        
        extract(design);
        return images;
    }
}