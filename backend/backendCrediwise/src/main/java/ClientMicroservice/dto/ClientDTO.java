package ClientMicroservice.dto;

import ClientMicroservice.entities.Cycle;
import ClientMicroservice.entities.Nationality;
import ClientMicroservice.entities.TypeClient;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public class ClientDTO {

    public UUID id;
    public TypeClient clientType;
    public String status;
    public Integer segmentId;
    public String scoring;
    public String firstName;
    public String lastName;
    public String companyName;
    public String registrationNumber;
    public String nationalId;
    public LocalDate dateOfBirth;
    public Nationality nationality;           // code ou id
    public String taxIdentifier;
    public String sexe;
    public String email;
    public String Cin;
    public String primaryPhone;
    public String secondaryPhone;
    public String addressStreet;
    public String addressCity;
    public String addressPostal;
    public String addressCountry;
    public String idBranch;
    public Integer sectorActivityId;
    public Integer subActivityId;
    public Cycle cycle;
    public String assignedManager;
    public String principalInterlocutor;
    public Integer familySituationId;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
}