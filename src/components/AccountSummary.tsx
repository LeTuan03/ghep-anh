import React from 'react';
import type { AccountInfo } from '../mockData';
import { Shield, Trophy, Target, Award, Users, Shirt } from 'lucide-react';
import './AccountSummary.css';

interface AccountSummaryProps {
  info: AccountInfo;
}

export const AccountSummary: React.FC<AccountSummaryProps> = ({ info }) => {
  return (
    <div className="account-summary-card">
      <div className="summary-row top-row">
        {/* Heroes & Skins Count */}
        <div className="stats-box primary-stat">
          <div className="stat-item">
            <Users className="stat-icon hero-icon" />
            <div className="stat-text">
              <span className="stat-label">Tướng</span>
              <span className="stat-value highlight">{info.totalHeroes}</span>
            </div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <Shirt className="stat-icon skin-icon" />
            <div className="stat-text">
              <span className="stat-label">Trang phục</span>
              <span className="stat-value highlight">{info.totalSkins}</span>
            </div>
          </div>
        </div>

        {/* Rank Information */}
        <div className="stats-box rank-box">
          <div className="rank-item">
            <Trophy className="rank-icon gold" />
            <span>Hiện tại<br/><strong>{info.rankCurrent}</strong></span>
          </div>
          <div className="rank-item">
            <Award className="rank-icon silver" />
            <span>Lịch sử<br/><strong>{info.rankHighest}</strong></span>
          </div>
        </div>
      </div>

      <div className="summary-row bottom-row">
        {/* Match Stats */}
        <div className="match-stats">
          <div className="stat-cell">
            <Target className="small-icon" /> {info.totalMatches} Trận
          </div>
          <div className="stat-cell">
            <Shield className="small-icon" /> {info.winRate}% Tỷ lệ thắng
          </div>
          <div className="legendary-marks">
            <span className="mark-badge">Dấu ấn truyền kỳ: {info.legendaryMarks}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
