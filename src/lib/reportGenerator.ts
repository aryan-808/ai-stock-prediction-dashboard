// Report generation utilities for PDF and Excel
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { StockData, NewsItem } from './stockApi';
import { ModelPrediction, ModelMetrics } from './mlModels';

export async function generatePDFReport(data: {
  symbol: string;
  historicalData: StockData[];
  predictions: { [key: string]: ModelPrediction[] };
  metrics: { [key: string]: ModelMetrics };
  news: NewsItem[];
  selectedModels: string[];
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(`Stock Prediction Report: ${data.symbol}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Current Price
  const currentPrice = data.historicalData[data.historicalData.length - 1]?.close;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Current Price: $${currentPrice?.toFixed(2)}`, 20, yPos);
  yPos += 10;

  // Models Used
  doc.setFontSize(12);
  doc.text(`Models: ${data.selectedModels.join(', ')}`, 20, yPos);
  yPos += 15;

  // Predictions Summary
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Predictions Summary', 20, yPos);
  yPos += 10;

  data.selectedModels.forEach((model) => {
    const modelKey = model.toLowerCase();
    const preds = data.predictions[modelKey];
    if (preds && preds.length > 0) {
      const lastPred = preds[preds.length - 1];
      const change = ((lastPred.predicted - currentPrice) / currentPrice) * 100;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `${model}: $${lastPred.predicted.toFixed(2)} (${change > 0 ? '+' : ''}${change.toFixed(2)}%)`,
        30,
        yPos
      );
      yPos += 7;
    }
  });
  yPos += 10;

  // Metrics
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Model Performance Metrics', 20, yPos);
  yPos += 10;

  data.selectedModels.forEach((model) => {
    const modelKey = model.toLowerCase();
    const metric = data.metrics[modelKey];
    if (metric) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${model}:`, 30, yPos);
      yPos += 7;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`MAE: ${metric.mae.toFixed(2)} | RMSE: ${metric.rmse.toFixed(2)} | R²: ${metric.r2.toFixed(4)}`, 35, yPos);
      yPos += 6;
      doc.text(`Sharpe Ratio: ${metric.sharpeRatio.toFixed(2)} | Volatility: ${metric.volatility.toFixed(2)}%`, 35, yPos);
      yPos += 6;
      doc.text(`Max Drawdown: ${metric.maxDrawdown.toFixed(2)}%`, 35, yPos);
      yPos += 10;
    }
  });

  // Sentiment Analysis
  if (data.news.length > 0) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    const avgSentiment = data.news.reduce((sum, item) => sum + item.sentiment, 0) / data.news.length;
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Sentiment Analysis', 20, yPos);
    yPos += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Average Sentiment: ${(avgSentiment * 100).toFixed(1)}% (${avgSentiment > 0 ? 'Bullish' : avgSentiment < 0 ? 'Bearish' : 'Neutral'})`, 30, yPos);
    yPos += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent News Headlines:', 30, yPos);
    yPos += 7;

    doc.setFont('helvetica', 'normal');
    data.news.slice(0, 10).forEach((item) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      const truncatedTitle = item.title.length > 80 ? item.title.substring(0, 80) + '...' : item.title;
      doc.setFontSize(9);
      doc.text(`• ${truncatedTitle}`, 35, yPos);
      yPos += 6;
    });
  }

  // Save PDF
  doc.save(`${data.symbol}_prediction_report_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function generateExcelReport(data: {
  symbol: string;
  historicalData: StockData[];
  predictions: { [key: string]: ModelPrediction[] };
  metrics: { [key: string]: ModelMetrics };
  news: NewsItem[];
  selectedModels: string[];
}) {
  const workbook = XLSX.utils.book_new();

  // Historical Data Sheet
  const historicalSheet = XLSX.utils.json_to_sheet(
    data.historicalData.map(d => ({
      Date: d.date,
      Open: d.open,
      High: d.high,
      Low: d.low,
      Close: d.close,
      Volume: d.volume,
    }))
  );
  XLSX.utils.book_append_sheet(workbook, historicalSheet, 'Historical Data');

  // Predictions Sheet
  data.selectedModels.forEach((model) => {
    const modelKey = model.toLowerCase();
    const preds = data.predictions[modelKey];
    if (preds) {
      const predSheet = XLSX.utils.json_to_sheet(
        preds.map(p => ({
          Date: p.date,
          'Predicted Price': p.predicted,
          'Confidence': (p.confidence * 100).toFixed(2) + '%',
          'Actual Price': p.actual || 'N/A',
        }))
      );
      XLSX.utils.book_append_sheet(workbook, predSheet, `${model} Predictions`);
    }
  });

  // Metrics Sheet
  const metricsData = data.selectedModels.map((model) => {
    const modelKey = model.toLowerCase();
    const metric = data.metrics[modelKey];
    return {
      Model: model,
      MAE: metric?.mae || 'N/A',
      RMSE: metric?.rmse || 'N/A',
      MAPE: metric?.mape ? `${metric.mape}%` : 'N/A',
      'R²': metric?.r2 || 'N/A',
      'Sharpe Ratio': metric?.sharpeRatio || 'N/A',
      'Volatility': metric?.volatility ? `${metric.volatility}%` : 'N/A',
      'Max Drawdown': metric?.maxDrawdown ? `${metric.maxDrawdown}%` : 'N/A',
    };
  });
  const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
  XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Metrics');

  // News & Sentiment Sheet
  if (data.news.length > 0) {
    const newsSheet = XLSX.utils.json_to_sheet(
      data.news.map(n => ({
        Title: n.title,
        Source: n.source,
        'Published At': new Date(n.publishedAt).toLocaleString(),
        'Sentiment': (n.sentiment * 100).toFixed(1) + '%',
        URL: n.url,
      }))
    );
    XLSX.utils.book_append_sheet(workbook, newsSheet, 'News & Sentiment');
  }

  // Write file
  XLSX.writeFile(workbook, `${data.symbol}_prediction_report_${new Date().toISOString().split('T')[0]}.xlsx`);
}