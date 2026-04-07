package bksgroups.cm.community_water_project.service;

import net.sf.jasperreports.engine.*;
import net.sf.jasperreports.engine.export.ooxml.JRXlsxExporter;
import net.sf.jasperreports.export.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.sql.DataSource;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.sql.Connection;
import java.util.HashMap;
import java.util.Map;

@Service
public class ReportService {

    @Autowired
    private DataSource dataSource;

    public byte[] generateReport(
            String templateName,
            Map<String, Object> params,
            String format) throws Exception {

        // Read template as input stream — works inside packaged JAR
        InputStream templateStream = getClass()
            .getClassLoader()
            .getResourceAsStream("reports/" + templateName + ".jrxml");

        if (templateStream == null) {
            throw new Exception(
                "Report template not found: reports/" + templateName + ".jrxml"
            );
        }

        // Compile report from stream
        JasperReport jasperReport = JasperCompileManager
            .compileReport(templateStream);

        // Fill report with data from database
        try (Connection connection = dataSource.getConnection()) {
            JasperPrint jasperPrint = JasperFillManager.fillReport(
                jasperReport, params, connection
            );

            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();

            if ("xlsx".equalsIgnoreCase(format)) {
                JRXlsxExporter exporter = new JRXlsxExporter();
                exporter.setExporterInput(new SimpleExporterInput(jasperPrint));
                exporter.setExporterOutput(
                    new SimpleOutputStreamExporterOutput(outputStream)
                );
                SimpleXlsxReportConfiguration config =
                    new SimpleXlsxReportConfiguration();
                config.setOnePagePerSheet(false);
                exporter.setConfiguration(config);
                exporter.exportReport();
            } else {
                JasperExportManager.exportReportToPdfStream(
                    jasperPrint, outputStream
                );
            }

            return outputStream.toByteArray();
        }
    }

    public byte[] subscriptionStatement(
            int householdId, int year, String format) throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("HOUSEHOLD_ID", householdId);
        params.put("YEAR", year);
        return generateReport("subscription_statement", params, format);
    }

    public byte[] annualFinanceSummary(
            int year, String format) throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("YEAR", year);
        return generateReport("annual_finance", params, format);
    }

    public byte[] maintenanceCostReport(
            int year, String format) throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("YEAR", year);
        return generateReport("maintenance_cost", params, format);
    }

    public byte[] overdueSubscriptions(
            int year, String format) throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("YEAR", year);
        return generateReport("overdue_subscriptions", params, format);
    }

    public byte[] committeePaymentsReport(
            int year, String format) throws Exception {
        Map<String, Object> params = new HashMap<>();
        params.put("YEAR", year);
        return generateReport("committee_payments", params, format);
    }
}