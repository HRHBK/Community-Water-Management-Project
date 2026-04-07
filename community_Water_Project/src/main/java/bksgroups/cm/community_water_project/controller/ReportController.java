package bksgroups.cm.community_water_project.controller;

import bksgroups.cm.community_water_project.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportService reportService;

    private HttpHeaders buildHeaders(String reportName, String format) {
        HttpHeaders headers = new HttpHeaders();
        if ("xlsx".equalsIgnoreCase(format)) {
            headers.setContentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            ));
            headers.setContentDispositionFormData("attachment", reportName + ".xlsx");
        } else {
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", reportName + ".pdf");
        }
        return headers;
    }

    @GetMapping("/subscription-statement")
    public ResponseEntity<byte[]> subscriptionStatement(
            @RequestParam int householdId,
            @RequestParam int year,
            @RequestParam(defaultValue = "pdf") String format) {
        try {
            byte[] report = reportService.subscriptionStatement(householdId, year, format);
            return new ResponseEntity<>(report, buildHeaders("subscription_statement", format), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/annual-finance")
    public ResponseEntity<byte[]> annualFinance(
            @RequestParam int year,
            @RequestParam(defaultValue = "pdf") String format) {
        try {
            byte[] report = reportService.annualFinanceSummary(year, format);
            return new ResponseEntity<>(report, buildHeaders("annual_finance", format), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/maintenance-cost")
    public ResponseEntity<byte[]> maintenanceCost(
            @RequestParam int year,
            @RequestParam(defaultValue = "pdf") String format) {
        try {
            byte[] report = reportService.maintenanceCostReport(year, format);
            return new ResponseEntity<>(report, buildHeaders("maintenance_cost", format), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/overdue-subscriptions")
    public ResponseEntity<byte[]> overdueSubscriptions(
            @RequestParam int year,
            @RequestParam(defaultValue = "pdf") String format) {
        try {
            byte[] report = reportService.overdueSubscriptions(year, format);
            return new ResponseEntity<>(report, buildHeaders("overdue_subscriptions", format), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/committee-payments")
    public ResponseEntity<byte[]> committeePayments(
            @RequestParam int year,
            @RequestParam(defaultValue = "pdf") String format) {
        try {
            byte[] report = reportService.committeePaymentsReport(year, format);
            return new ResponseEntity<>(report, buildHeaders("committee_payments", format), HttpStatus.OK);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
