// File: /backend/src/domain/entities/prototype-connection.entity.ts

export interface InteractiveElement {
    nodeId: string;
    name: string;
    type: string;
    parentFrameId: string;
    parentFrameName: string;
}

export interface FrameInfo {
    id: string;
    name: string;
    width: number;
    height: number;
    interactiveElements: InteractiveElement[];
}

export interface PrototypeConnection {
    sourceNodeId: string;
    sourceNodeName: string;
    targetFrameId: string;
    targetFrameName: string;
    trigger: 'ON_CLICK' | 'ON_HOVER' | 'ON_PRESS' | 'ON_DRAG';
    animation: {
        type: 'INSTANT' | 'DISSOLVE' | 'SMART_ANIMATE' | 'MOVE_IN' | 'MOVE_OUT' | 'PUSH' | 'SLIDE_IN' | 'SLIDE_OUT';
        direction?: 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM';
        duration?: number;
        easing?: 'LINEAR' | 'EASE_IN' | 'EASE_OUT' | 'EASE_IN_AND_OUT' | 'EASE_IN_BACK' | 'EASE_OUT_BACK' | 'EASE_IN_AND_OUT_BACK';
    };
    reasoning?: string;
}