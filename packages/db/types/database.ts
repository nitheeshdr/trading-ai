// Supabase Database types for TradeView
// Must match GenericSchema shape: { Tables, Views, Functions } + Relationships on each table

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      // ── users ────────────────────────────────────────────────────────────────
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          broker_connected: boolean;
          broker_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          broker_connected?: boolean;
          broker_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          broker_connected?: boolean;
          broker_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── subscriptions ────────────────────────────────────────────────────────
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "free" | "pro" | "elite";
          status: "active" | "cancelled" | "expired";
          started_at: string;
          expires_at: string | null;
          payment_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: "free" | "pro" | "elite";
          status?: "active" | "cancelled" | "expired";
          started_at?: string;
          expires_at?: string | null;
          payment_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: "free" | "pro" | "elite";
          status?: "active" | "cancelled" | "expired";
          started_at?: string;
          expires_at?: string | null;
          payment_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // ── trades ───────────────────────────────────────────────────────────────
      trades: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          exchange: string;
          type: "BUY" | "SELL";
          quantity: number;
          price: number;
          mode: "real" | "paper";
          broker_order_id: string | null;
          strategy_id: string | null;
          executed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          exchange?: string;
          type: "BUY" | "SELL";
          quantity: number;
          price: number;
          mode?: "real" | "paper";
          broker_order_id?: string | null;
          strategy_id?: string | null;
          executed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          exchange?: string;
          type?: "BUY" | "SELL";
          quantity?: number;
          price?: number;
          mode?: "real" | "paper";
          broker_order_id?: string | null;
          strategy_id?: string | null;
          executed_at?: string;
        };
        Relationships: [];
      };

      // ── watchlists ───────────────────────────────────────────────────────────
      watchlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          symbols: string[];
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          symbols?: string[];
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          symbols?: string[];
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── portfolios ───────────────────────────────────────────────────────────
      portfolios: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          exchange: string;
          quantity: number;
          avg_price: number;
          mode: "real" | "paper";
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          exchange?: string;
          quantity: number;
          avg_price: number;
          mode?: "real" | "paper";
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          exchange?: string;
          quantity?: number;
          avg_price?: number;
          mode?: "real" | "paper";
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── alerts ───────────────────────────────────────────────────────────────
      alerts: {
        Row: {
          id: string;
          user_id: string;
          symbol: string;
          exchange: string;
          condition: "above" | "below";
          price: number;
          triggered: boolean;
          triggered_at: string | null;
          notify_email: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          symbol: string;
          exchange?: string;
          condition: "above" | "below";
          price: number;
          triggered?: boolean;
          triggered_at?: string | null;
          notify_email?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          symbol?: string;
          exchange?: string;
          condition?: "above" | "below";
          price?: number;
          triggered?: boolean;
          triggered_at?: string | null;
          notify_email?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      // ── ai_logs ──────────────────────────────────────────────────────────────
      ai_logs: {
        Row: {
          id: string;
          user_id: string | null;
          symbol: string;
          exchange: string;
          model_type: "xgboost" | "lightgbm" | "lstm" | "transformer" | "cnn" | "finbert";
          signal: "BUY" | "SELL" | "HOLD";
          confidence: number;
          timeframe: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          symbol: string;
          exchange?: string;
          model_type: "xgboost" | "lightgbm" | "lstm" | "transformer" | "cnn" | "finbert";
          signal: "BUY" | "SELL" | "HOLD";
          confidence: number;
          timeframe?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          symbol?: string;
          exchange?: string;
          model_type?: "xgboost" | "lightgbm" | "lstm" | "transformer" | "cnn" | "finbert";
          signal?: "BUY" | "SELL" | "HOLD";
          confidence?: number;
          timeframe?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // ── auto_trade_strategies ────────────────────────────────────────────────
      auto_trade_strategies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          symbol: string;
          exchange: string;
          enabled: boolean;
          mode: "real" | "paper";
          entry_signal: "AI_BUY" | "PRICE_ABOVE" | "PRICE_BELOW" | "RSI_OVERSOLD" | "RSI_OVERBOUGHT";
          entry_price_level: number | null;
          min_confidence: number;
          quantity: number;
          profit_target_pct: number;
          stop_loss_pct: number;
          trailing_stop: boolean;
          trailing_stop_pct: number | null;
          max_hold_minutes: number;
          max_daily_trades: number;
          max_daily_loss_pct: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          symbol: string;
          exchange?: string;
          enabled?: boolean;
          mode?: "real" | "paper";
          entry_signal?: "AI_BUY" | "PRICE_ABOVE" | "PRICE_BELOW" | "RSI_OVERSOLD" | "RSI_OVERBOUGHT";
          entry_price_level?: number | null;
          min_confidence?: number;
          quantity: number;
          profit_target_pct: number;
          stop_loss_pct: number;
          trailing_stop?: boolean;
          trailing_stop_pct?: number | null;
          max_hold_minutes?: number;
          max_daily_trades?: number;
          max_daily_loss_pct?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          symbol?: string;
          exchange?: string;
          enabled?: boolean;
          mode?: "real" | "paper";
          entry_signal?: "AI_BUY" | "PRICE_ABOVE" | "PRICE_BELOW" | "RSI_OVERSOLD" | "RSI_OVERBOUGHT";
          entry_price_level?: number | null;
          min_confidence?: number;
          quantity?: number;
          profit_target_pct?: number;
          stop_loss_pct?: number;
          trailing_stop?: boolean;
          trailing_stop_pct?: number | null;
          max_hold_minutes?: number;
          max_daily_trades?: number;
          max_daily_loss_pct?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── auto_trade_executions ────────────────────────────────────────────────
      auto_trade_executions: {
        Row: {
          id: string;
          strategy_id: string;
          user_id: string;
          symbol: string;
          exchange: string;
          side: "BUY" | "SELL";
          quantity: number;
          entry_price: number | null;
          exit_price: number | null;
          profit_loss: number | null;
          profit_loss_pct: number | null;
          exit_reason: "PROFIT_TARGET" | "STOP_LOSS" | "TRAILING_STOP" | "TIME_EXIT" | "MANUAL" | "AI_REVERSAL" | null;
          status: "OPEN" | "CLOSED" | "CANCELLED";
          broker_order_id: string | null;
          mode: "real" | "paper";
          ai_signal_confidence: number | null;
          ai_model_type: string | null;
          entered_at: string;
          exited_at: string | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          strategy_id: string;
          user_id: string;
          symbol: string;
          exchange?: string;
          side: "BUY" | "SELL";
          quantity: number;
          entry_price?: number | null;
          exit_price?: number | null;
          profit_loss?: number | null;
          profit_loss_pct?: number | null;
          exit_reason?: "PROFIT_TARGET" | "STOP_LOSS" | "TRAILING_STOP" | "TIME_EXIT" | "MANUAL" | "AI_REVERSAL" | null;
          status?: "OPEN" | "CLOSED" | "CANCELLED";
          broker_order_id?: string | null;
          mode?: "real" | "paper";
          ai_signal_confidence?: number | null;
          ai_model_type?: string | null;
          entered_at?: string;
          exited_at?: string | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          strategy_id?: string;
          user_id?: string;
          symbol?: string;
          exchange?: string;
          side?: "BUY" | "SELL";
          quantity?: number;
          entry_price?: number | null;
          exit_price?: number | null;
          profit_loss?: number | null;
          profit_loss_pct?: number | null;
          exit_reason?: "PROFIT_TARGET" | "STOP_LOSS" | "TRAILING_STOP" | "TIME_EXIT" | "MANUAL" | "AI_REVERSAL" | null;
          status?: "OPEN" | "CLOSED" | "CANCELLED";
          broker_order_id?: string | null;
          mode?: "real" | "paper";
          ai_signal_confidence?: number | null;
          ai_model_type?: string | null;
          entered_at?: string;
          exited_at?: string | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
