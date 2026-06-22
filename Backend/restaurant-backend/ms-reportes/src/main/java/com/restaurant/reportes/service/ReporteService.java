package com.restaurant.reportes.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReporteService {

    public byte[] generarPdf(String templateName, Map<String, Object> params, List<?> datos) {
        try {
            InputStream stream = getClass().getResourceAsStream("/reports/" + templateName + ".jrxml");
            if (stream == null) {
                throw new RuntimeException("Template no encontrado: " + templateName);
            }
            JasperReport jasperReport = JasperCompileManager.compileReport(stream);

            JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(datos);
            Map<String, Object> parameters = new HashMap<>(params);

            JasperPrint jasperPrint = JasperFillManager.fillReport(jasperReport, parameters, dataSource);
            return JasperExportManager.exportReportToPdf(jasperPrint);

        } catch (JRException e) {
            throw new RuntimeException("Error al generar PDF: " + e.getMessage(), e);
        }
    }

    public byte[] generarPdfConListaVacia(String templateName, Map<String, Object> params) {
        return generarPdf(templateName, params, List.of(new Object()));
    }
}
