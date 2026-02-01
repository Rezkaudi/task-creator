/**
 * Test utility for ImageOptimizerService
 * Run this to verify the image optimization works correctly
 */

import { ImageOptimizerService } from './Image optimizer.service';

// Sample design with images (similar to your JSON structure)
const sampleDesignWithImages = [
    {
        "name": "Main Frame",
        "type": "FRAME",
        "x": 0,
        "y": 0,
        "width": 400,
        "height": 600,
        "fills": [
            {
                "type": "SOLID",
                "visible": true,
                "opacity": 1,
                "blendMode": "NORMAL",
                "color": { "r": 1, "g": 1, "b": 1 }
            }
        ],
        "children": [
            {
                "name": "Avatar",
                "type": "VECTOR",
                "x": 145,
                "y": 341,
                "width": 85,
                "height": 85,
                "fills": [
                    {
                        "type": "IMAGE",
                        "visible": true,
                        "opacity": 1,
                        "blendMode": "NORMAL",
                        "scaleMode": "FILL",
                        "imageHash": "7b517fd1166e1c96bb4d606ab3bc83385540dadb",
                        "imageData": "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAAAAXNSR0IArs4c6QAAQABJREFUeAF0veeSJUmW33e1vqlKthzRQ45xDUZ+AGGGpyC5lN+xhOEtlot34XMAMKwRNthZYLEzs9s9ontala6UV2v+fn+Pm1W9AKKybsaNcD9+/Ohz3COyvv/F/1vjaBzq9Xrt0KgdDodao95o1PZbLh+8XK/V9rbhaDQOhz1X8p0vXqrV/VU71Gv1+qHO3aYnu0O9WQcYl7zL+XZfazcdIgdDHPZ72jJGzV81e3GldmxP33KeCw7kINUXz4+4MUqjFgiHTW1/OGyW9e22tpzXVsva7O5we1e/m9RupvvbWX213Zz126fj/YOTxulZbXRa7w0P/cGh3a13+/VGq9ZqBRNmJClEzE8RyVz2784LImV2Od+DvOg1/AxJCvoV9QqoQklmWRGMEzC+n2mztt8DQByAICu4z6AFXC7zDe6UXlw+jiUQCBjucG5T7sGp/a4h18TfX/Io8IPiPetsvX83yq52aDabh92mQBGYvcFTzpexKjy9V8uwUMm50IJxG4cGBCls4TptuGLL3RYJ2R32jXqLLwHFRzjob3GoN3Z8VtJ4yDnjlltMpKIwMArBbeq8DtsKjt9FEviI6P6wRaBtBD6HXaGSXw87MPQGBOUsHTJ8BBGI5Raf5dzPUJkTjup6OQll0zCCqJxAjmMzm9bqrWbp5VVYWEBlVrn9Drhz3MtOr0NQ8P4vHffQZDBto4612k6mbqHO7rBZH" +
                        "zbb2m7P53a13nGuMMpGJPugoPrJxAuog4IiBTycUeZSvkqDOvpfvpX2xzv5DRLNaoLvgLzf4h4yF39InHfQHNRZV7zgvFzJxQLMxgEVfKrz0qVM5L3ROPV65dP2x77vtSlQj5/HgWgM2fnkKPfocn9+f/ID4Glnh2MXSHLfoJxUQOQ/dpMR9qUNn/BFEkNDqR46yyabFoCe2MujmtGRHY6cmcICz9MgDevwtwxBA65wCya+g1BHC9O56Qm2obB/Vy9GyJnEIKEnkloQ+6KLjaNpjFrR/p2RUr5yFOYVmak39lgJ5qjkZ7LFOByJZYdyzihOjHZc8YdxtXoFJPJNswhvOIuqNGIRosDwDDPG6X5b32xq+IH1prZe15abxgY9oGu90enU251aE2PflvyNVr3V9muj5YAAZ2rM8TiJCquMLjYiWRQyLSBUSK+dDvHeIwR9ItCBW+7eg+EEKEytWWZWfGqBTCdu+7+c8Zsvx4FCJYdiPtIp7bCgkQZmzhTww94oVr+SkghNOcf6Ru2BYSvxP86I86bWMCJEfwUOq0lDTHqZTsQA462ZkjXFxev56SQc+MFnnJycsX28h0D46t2wmLkXeW00ZR4NaVFzLE4KkBAh3faRbFvQNA1t7C0xKZ9g6w8H7gWy6NEyordtEwnY73bQLNiWge4BpbU3yuyPwyjhOSKXnhnkeDgYP7T33E+n5meOCtFcp12aiR43y3nVpTRWgITmRU+KE/QedtX5BE7BLT388KvNK4pI3v2O4K2+w/Bva9vNHgewXKIA+9VW1LqdQ7tZ77Tq7Xaj2TXmUfSbETCAMUqzQLuH6TAFfDWIF94dx6FFL3QteNqnUOJ+RghfpnDfF0Fgavdf/+HJf36LK/xInKAS0S+9gjnk0Jkf4WhfvX48OL+f1H92Qq90TPv3W1ZjHeHQUZhlUvd8LIzwIoJxj0AGTvvSq+BWr4JV+FvJFe3QXgcNsgU3hvkH5Kq+puV94+PkwOgHiBXgZSLc4h4fxUSVi6Uj55g9MGbkEAsF4og25yRKU3FS3eOikRwnMhtO6BnskQEQVL8cDye0o2URnDI5G9AY8eCmfuYoVeWiXQ8GKh7cum9gF+DxCwj5XdrwGeUwtmOGKDe3d5vDdtvYbA+rVR3zv94SAkmFZgMFaPQ6NTxAp3Nooga4Ak8w/8FExc5c+GSafnmnisy6mkqZc7mrxmJZuBXPoRDYrvj3OFix5kpyqgpCFdcGwv1EHLtcCXzko/z2+g8Ii0k6Ek6ND8JxjNAaXkuQTATKi7+HwqcYAKuiOD05kMGg57mNuVIcZWwcEgODdSqgQgdHogUnxtP6BGwhtpkJE20TQApEC8J5Y6d8O6YBqqJTxzbxCadEIm2DXIVtEMq5tzh05bZn1BgXTKRtlL3MiXulmdN+bxZKFiOi/03OJIDN1C8H5prfgeDkarWWeJcmufrOhJSu1S2SFXpD"
                    }
                ]
            },
            {
                "name": "Logo",
                "type": "VECTOR",
                "x": 50,
                "y": 50,
                "width": 100,
                "height": 100,
                "fills": [
                    {
                        "type": "IMAGE",
                        "visible": true,
                        "opacity": 1,
                        "blendMode": "NORMAL",
                        "scaleMode": "FIT",
                        "imageHash": "abc123def456ghi789jkl012mno345pqr678stu",
                        "imageData": "aW1hZ2VEYXRhMTIzNDU2Nzg5MAo="
                    }
                ]
            },
            {
                "name": "Button",
                "type": "RECTANGLE",
                "x": 100,
                "y": 500,
                "width": 200,
                "height": 50,
                "fills": [
                    {
                        "type": "SOLID",
                        "visible": true,
                        "opacity": 1,
                        "blendMode": "NORMAL",
                        "color": { "r": 0.2, "g": 0.5, "b": 1 }
                    }
                ],
                "children": [
                    {
                        "name": "Button Text",
                        "type": "TEXT",
                        "x": 120,
                        "y": 510,
                        "characters": "Click Me",
                        "fontSize": 16,
                        "fills": [
                            {
                                "type": "SOLID",
                                "color": { "r": 1, "g": 1, "b": 1 }
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

/**
 * Run all tests
 */
export function runImageOptimizerTests() {
    console.log("╔════════════════════════════════════════════════════════════╗");
    console.log("║       IMAGE OPTIMIZER SERVICE - TEST SUITE                 ║");
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    const service = new ImageOptimizerService();

    // Test 1: Basic strip and restore
    testBasicStripAndRestore(service);

    // Test 2: Token savings calculation
    testTokenSavings(service);

    // Test 3: Smart matching after structure change
    testSmartMatching(service);

    // Test 4: Round-trip validation
    testRoundTripValidation(service);

    // Test 5: Edge cases
    testEdgeCases(service);

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║                   ALL TESTS COMPLETE                       ║");
    console.log("╚════════════════════════════════════════════════════════════╝");
}

function testBasicStripAndRestore(service: ImageOptimizerService) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("TEST 1: Basic Strip and Restore");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const originalDesign = JSON.parse(JSON.stringify(sampleDesignWithImages));
    const originalSize = JSON.stringify(originalDesign).length;

    // Strip images
    const { cleanedDesign, imageReferences } = service.stripImages(originalDesign);
    const cleanedSize = JSON.stringify(cleanedDesign).length;

    // Verify images were stripped
    const hasImageData = JSON.stringify(cleanedDesign).includes('iVBORw0KGgoAAAA');
    
    console.log(`✓ Original size: ${originalSize} chars`);
    console.log(`✓ Cleaned size: ${cleanedSize} chars`);
    console.log(`✓ Reduction: ${((1 - cleanedSize / originalSize) * 100).toFixed(1)}%`);
    console.log(`✓ Images extracted: ${imageReferences.length}`);
    console.log(`✓ imageData removed: ${!hasImageData ? 'YES' : 'NO'}`);

    // Restore images
    const restoredDesign = service.restoreImages(cleanedDesign, imageReferences);
    const restoredSize = JSON.stringify(restoredDesign).length;

    console.log(`✓ Restored size: ${restoredSize} chars`);
    console.log(`✓ Size matches original: ${Math.abs(restoredSize - originalSize) < 10 ? 'YES' : 'NO'}`);

    const passed = !hasImageData && imageReferences.length === 2 && Math.abs(restoredSize - originalSize) < 10;
    console.log(`\n${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
}

function testTokenSavings(service: ImageOptimizerService) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("TEST 2: Token Savings Calculation");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const design = JSON.parse(JSON.stringify(sampleDesignWithImages));
    const { cleanedDesign, imageReferences } = service.stripImages(design);

    const originalTokens = Math.floor(JSON.stringify(design).length / 4);
    const cleanedTokens = Math.floor(JSON.stringify(cleanedDesign).length / 4);
    const savings = originalTokens - cleanedTokens;
    const savingsPercent = ((savings / originalTokens) * 100).toFixed(1);

    console.log(`✓ Original tokens (estimated): ${originalTokens}`);
    console.log(`✓ Cleaned tokens (estimated): ${cleanedTokens}`);
    console.log(`✓ Tokens saved: ${savings} (${savingsPercent}%)`);

    const passed = savings > 0 && parseInt(savingsPercent) > 50;
    console.log(`\n${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
}

function testSmartMatching(service: ImageOptimizerService) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("TEST 3: Smart Matching (Structure Changed)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const design = JSON.parse(JSON.stringify(sampleDesignWithImages));
    const { cleanedDesign, imageReferences } = service.stripImages(design);

    // Simulate AI reorganizing structure - move Avatar to different position
    const modifiedByAI = JSON.parse(JSON.stringify(cleanedDesign));
    const avatar = modifiedByAI[0].children[0]; // Get Avatar
    modifiedByAI[0].children.splice(0, 1); // Remove from original position
    modifiedByAI[0].children.push(avatar); // Add to end

    console.log(`✓ Original Avatar position: children[0]`);
    console.log(`✓ Modified Avatar position: children[2]`);

    // Try to restore - should use smart matching
    const restoredDesign = service.restoreImages(modifiedByAI, imageReferences);

    // Check if images were restored
    const avatarImageRestored = restoredDesign[0].children[2].fills[0].imageData !== undefined;
    
    console.log(`✓ Avatar image restored via smart match: ${avatarImageRestored ? 'YES' : 'NO'}`);

    const passed = avatarImageRestored;
    console.log(`\n${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
}

function testRoundTripValidation(service: ImageOptimizerService) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("TEST 4: Round-Trip Validation");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const original = JSON.parse(JSON.stringify(sampleDesignWithImages));
    const { cleanedDesign, imageReferences } = service.stripImages(original);
    const restored = service.restoreImages(cleanedDesign, imageReferences);

    const isValid = service.validateRoundTrip(original, imageReferences, restored);

    console.log(`✓ Round-trip validation: ${isValid ? 'VALID' : 'INVALID'}`);
    console.log(`\n${isValid ? '✅ PASSED' : '❌ FAILED'}\n`);
}

function testEdgeCases(service: ImageOptimizerService) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("TEST 5: Edge Cases");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Test empty design
    const emptyDesign: any[] = [];
    const result1 = service.stripImages(emptyDesign);
    console.log(`✓ Empty design handled: ${result1.imageReferences.length === 0 ? 'YES' : 'NO'}`);

    // Test design without images
    const noImageDesign = [{
        name: "Frame",
        type: "FRAME",
        fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }],
        children: []
    }];
    const result2 = service.stripImages(noImageDesign);
    console.log(`✓ No-image design handled: ${result2.imageReferences.length === 0 ? 'YES' : 'NO'}`);

    // Test deeply nested images
    const deepDesign = [{
        name: "Root",
        children: [{
            name: "Level1",
            children: [{
                name: "Level2",
                children: [{
                    name: "Level3",
                    fills: [{
                        type: "IMAGE",
                        imageHash: "deep123",
                        imageData: "deepImageData"
                    }]
                }]
            }]
        }]
    }];
    const result3 = service.stripImages(deepDesign);
    console.log(`✓ Deep nesting handled: ${result3.imageReferences.length === 1 ? 'YES' : 'NO'}`);

    const passed = result1.imageReferences.length === 0 && 
                   result2.imageReferences.length === 0 && 
                   result3.imageReferences.length === 1;
    
    console.log(`\n${passed ? '✅ PASSED' : '❌ FAILED'}\n`);
}

// Export for use in your test suite
export function quickTest() {
    console.log("Running quick test...\n");
    const service = new ImageOptimizerService();
    
    const original = JSON.parse(JSON.stringify(sampleDesignWithImages));
    console.log("1. Original design size:", JSON.stringify(original).length, "chars");
    
    const { cleanedDesign, imageReferences } = service.stripImages(original);
    console.log("2. After stripping:", JSON.stringify(cleanedDesign).length, "chars");
    console.log("3. Images extracted:", imageReferences.length);
    
    const restored = service.restoreImages(cleanedDesign, imageReferences);
    console.log("4. After restoration:", JSON.stringify(restored).length, "chars");
    
    const valid = service.validateRoundTrip(original, imageReferences, restored);
    console.log("5. Validation:", valid ? "PASSED ✅" : "FAILED ❌");
}