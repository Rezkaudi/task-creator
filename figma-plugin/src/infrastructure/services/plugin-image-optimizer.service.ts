/**
 * Image Optimizer Service for Figma Plugin
 * Strips images before sending to backend, restores them after receiving response
 * 
 * Usage in plugin-message.handler.ts:
 * 
 * import { ImageOptimizerService } from '../../infrastructure/services/image-optimizer.service';
 * 
 * private imageOptimizer = new ImageOptimizerService();
 */

export interface ImageReference {
    path: string[];
    imageHash: string;
    imageData: string;
    scaleMode?: string;
}

export interface ImageStripResult {
    cleanedDesign: any;
    imageReferences: ImageReference[];
}

export class ImageOptimizerService {
    /**
     * Strips all images from design JSON
     */
    stripImages(design: any[] | any): ImageStripResult {
        const imageReferences: ImageReference[] = [];
        
        // Convert to array if single object
        const designArray = Array.isArray(design) ? design : [design];
        
        // Deep clone to avoid mutating original
        const cleanedDesign = JSON.parse(JSON.stringify(designArray));
        
        // Process the design to find and extract images
        this.processNode(cleanedDesign, [], imageReferences);
        
        console.log(`📸 Plugin: Stripped ${imageReferences.length} images from design`);
        console.log(`📉 Plugin: Token reduction: ~${this.estimateTokenSavings(imageReferences)} tokens saved`);
        
        return {
            cleanedDesign: Array.isArray(design) ? cleanedDesign : cleanedDesign[0],
            imageReferences
        };
    }
    
    /**
     * Restores images to their original locations
     */
    restoreImages(modifiedDesign: any[] | any, imageReferences: ImageReference[]): any {
        // Convert to array if single object
        const designArray = Array.isArray(modifiedDesign) ? modifiedDesign : [modifiedDesign];
        
        // Deep clone
        const restoredDesign = JSON.parse(JSON.stringify(designArray));
        
        let restoredCount = 0;
        
        // Restore each image
        for (const imageRef of imageReferences) {
            const restored = this.restoreImageAtPath(restoredDesign, imageRef);
            if (restored) {
                restoredCount++;
            }
        }
        
        console.log(`📸 Plugin: Restored ${restoredCount}/${imageReferences.length} images`);
        
        // Return in same format as input
        return Array.isArray(modifiedDesign) ? restoredDesign : restoredDesign[0];
    }
    
    private processNode(node: any, currentPath: any[], imageReferences: ImageReference[]): void {
        if (!node || typeof node !== 'object') {
            return;
        }
        
        // Handle arrays
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
                    const imagePath = [...currentPath, 'fills', fillIndex];
                    
                    imageReferences.push({
                        path: imagePath,
                        imageHash: fill.imageHash || '',
                        imageData: fill.imageData,
                        scaleMode: fill.scaleMode
                    });
                    
                    // Remove imageData
                    delete fill.imageData;
                    fill._imageStripped = true;
                }
            });
        }
        
        // Recursively process children
        if (node.children && Array.isArray(node.children)) {
            this.processNode(node.children, [...currentPath, 'children'], imageReferences);
        }
        
        // Process other nested objects
        for (const key in node) {
            if (key !== 'fills' && key !== 'children' && typeof node[key] === 'object') {
                this.processNode(node[key], [...currentPath, key], imageReferences);
            }
        }
    }
    
    private restoreImageAtPath(design: any, imageRef: ImageReference): boolean {
        try {
            let current: any = design;
            
            // Navigate to the parent of the fill object
            for (let i = 0; i < imageRef.path.length - 1; i++) {
                const key = imageRef.path[i];
                if (current[key] === undefined) {
                    // Path doesn't exist - try smart match
                    return this.smartRestoreImage(design, imageRef);
                }
                current = current[key];
            }
            
            const fillIndex = imageRef.path[imageRef.path.length - 1];
            
            if (!current[fillIndex]) {
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
    
    private findImageFillByHash(node: any, imageHash: string): { fill: any } | null {
        if (!node || typeof node !== 'object') {
            return null;
        }
        
        if (Array.isArray(node)) {
            for (const item of node) {
                const found = this.findImageFillByHash(item, imageHash);
                if (found) return found;
            }
            return null;
        }
        
        if (node.fills && Array.isArray(node.fills)) {
            for (const fill of node.fills) {
                if (fill.type === 'IMAGE' && 
                    (fill.imageHash === imageHash || fill._imageStripped === true)) {
                    return { fill };
                }
            }
        }
        
        if (node.children && Array.isArray(node.children)) {
            for (const child of node.children) {
                const found = this.findImageFillByHash(child, imageHash);
                if (found) return found;
            }
        }
        
        for (const key in node) {
            if (typeof node[key] === 'object') {
                const found = this.findImageFillByHash(node[key], imageHash);
                if (found) return found;
            }
        }
        
        return null;
    }
    
    private estimateTokenSavings(imageReferences: ImageReference[]): number {
        let totalChars = 0;
        for (const ref of imageReferences) {
            totalChars += ref.imageData.length;
        }
        return Math.floor(totalChars / 4);
    }
}