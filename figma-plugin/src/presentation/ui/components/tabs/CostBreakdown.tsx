import React from 'react';
import { CostInfo } from '../../types/index.ts';
import '../../styles/CostBreakdown.css';

interface CostBreakdownProps {
    cost: CostInfo | null;
}

export default function CostBreakdown({ cost }: CostBreakdownProps): React.JSX.Element | null {
    if (!cost) return null;

    return (
        <div className="cost-breakdown">
            <div className="cost-header">💰 Cost Breakdown</div>
            <div className="cost-row">
                <span className="cost-label">Input:</span>
                <span className="cost-value">
                    {cost.inputCost} <small>({cost.inputTokens.toLocaleString()} tokens)</small>
                </span>
            </div>
            <div className="cost-row">
                <span className="cost-label">Output:</span>
                <span className="cost-value">
                    {cost.outputCost} <small>({cost.outputTokens.toLocaleString()} tokens)</small>
                </span>
            </div>
            <div className="cost-row cost-total">
                <span className="cost-label">Total:</span>
                <span className="cost-value">{cost.totalCost}</span>
            </div>
        </div>
    );
}
