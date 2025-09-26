from django.db import models

# Create your models here.
class organisation(models.Model):
    organisation_name = models.CharField(max_length=100)

    def __str__(self):
        return f"Organisation {self.organisation_name}"

class service(models.Model):
    organisation_key = models.ForeignKey(organisation, on_delete=models.CASCADE)
    service_name = models.CharField(max_length=100)

    def __str__(self):
        return f" Service {self.service_name}"
    
class campus(models.Model):
    organisation_key = models.ForeignKey(organisation, on_delete=models.CASCADE)
    campus_name = models.CharField(max_length=100)

    def __str__(self):
        return f" Campus {self.campus_name}"
    
class service_campus(models.Model):
    service_key = models.ForeignKey(service, on_delete=models.CASCADE)
    campus_key = models.ForeignKey(campus, on_delete=models.CASCADE)
    email = models.EmailField(max_length=50, null=True, blank=True)
    phone = models.CharField(max_length=15, null=True, blank=True)
    website = models.URLField(max_length=100, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    expectesd_wait_time = models.CharField(max_length=20, null=True, blank=True)
    op_hours_24_7 = models.BooleanField(default=False, null=True, blank=True)
    op_hours_standard = models.BooleanField(default=False, null=True, blank=True)
    op_hours_extended = models.BooleanField(default=False, null=True, blank=True)
    op_hours_extended_details = models.TextField(null=True, blank=True)
    address = models.CharField(max_length=200, null=True, blank=True)
    suburb = models.CharField(max_length=100, null=True, blank=True)
    state = models.CharField(max_length=100, null=True, blank=True)
    postcode = models.CharField(max_length=10, null=True, blank=True)
    eligibility_and_discription = models.TextField(null=True, blank=True)

    def __str__(self):
        return f" Service Campus {self.id}"
    
class service_type(models.Model):
    SERVICE_TYPE = [
        ('Mental Health promotion', 'Mental Health promotion'),
        ('Mental Illness prevention', 'Mental Illness prevention'),
        ('Primary and Specialised clinical ambulatory mental health care services', 'Primary and Specialised clinical ambulatory mental health care services'),
        ('Specialised mental health community support services', 'Specialised mental health community support services'),
        ('Specialised bed-based mental health care services', 'Specialised bed-based mental health care services'),
        ('Medication and prodeures', 'Medication and procedures'),
        ]
    
    service_campus_key = models.ForeignKey(service_campus, on_delete=models.CASCADE)
    service_type_num = models.IntegerField(choices=[(1, '1'),(2, '2'),(3, '3'),(4, '4'),(5, '5'),(6, '6')], null=True, blank=True)
    service_type = models.CharField(max_length=100, null=True, blank=True, choices=SERVICE_TYPE)

    def __str__(self):
        return f" Service Type {self.id}"

class target_population(models.Model):
    TARGET_POPULATION = [  
        ('AOD', 'AOD'),
        ('Aboriginal and Torres Strait Islander', 'Aboriginal and Torres Strait Islander'),
        ('Adult', 'Adult'),
        ('Children', 'Children'),
        ('Culturally and Linguistically Diverse', 'Culturally and Linguistically Diverse'),
        ('Families', 'Families'),
        ('Homeless', 'Homeless'),
        ('Hospital', 'Hospital'),
        ('LGBTQIA+', 'LGBTQIA+'),
        ('Older Adults', 'Older Adults'),
        ('Specialised Services', 'Specialised Services'),
        ('Young People', 'Young People'),
        ]
    
    service_campus_key = models.ForeignKey(service_campus, on_delete=models.CASCADE)
    target_population = models.CharField(choices=TARGET_POPULATION)

    def __str__(self):
        return f" Target Population {self.id}"

class service_region(models.Model):
        service_campus_key = models.ForeignKey(service_campus, on_delete=models.CASCADE, null=True, blank=True)
        region_key = models.ForeignKey('region', on_delete=models.CASCADE, null=True, blank=True)
    
        def __str__(self):
            return f" Service Region {self.service_campus_key} - {self.region_key}"

class level_of_care(models.Model):
    LEVEL_OF_CARE = [
        ('Self management', 'Self management'),
        ('Low intensity', 'Low intensity'),
        ('Moderate intensity', 'Moderate intensity'),
        ('High intensity', 'High intensity'),
        ('Specialist', 'Specialist'),
        ]
    
    service_campus_key = models.ForeignKey(service_campus, on_delete=models.CASCADE)
    level_of_care_num = models.IntegerField(choices=[(1, '1'),(2, '2'),(3, '3'),(4, '4'),(5, '5')], null=True, blank=True)
    level_of_care = models.CharField(choices=LEVEL_OF_CARE, null=True, blank=True)

    def __str__(self):
        return f" Level of Care {self.id}"
    
class cost(models.Model):
    COST_OPTIONS = [
        ('Free', 'Free'),
        ('N/A', 'N/A'),
        ('Paid', 'Paid'),
        ]

    service_campus_key = models.ForeignKey(service_campus, on_delete=models.CASCADE)
    cost = models.CharField(choices=COST_OPTIONS)

    def __str__(self):
        return f" Cost {self.id}"

class referral_pathway(models.Model):
    REFERRAL_PATHWAY = [
        ('Doctor/GP referral', 'Doctor/GP referral'),
        ('Free call', 'Free call'),
        ('General booking', 'General booking'),
        ('Varies depending on service', 'Varies depending on service'),
        ]
    
    service_campus_key = models.ForeignKey(service_campus, on_delete=models.CASCADE)
    referral_pathway = models.TextField(choices=REFERRAL_PATHWAY)

    def __str__(self):
        return f" Referral Pathway {self.id}"

class workforce_type(models.Model):
    WORKFORCE_TYPE = [
        ('Medical', 'Medical'),
        ('Peer worker', 'Peer worker'),
        ('Tertiary qualified', 'Tertiary qualified'),
        ('Vocationally qualified', 'Vocationally qualified'),
        ]

    service_campus_key = models.ForeignKey(service_campus, on_delete=models.CASCADE)
    workforce_type = models.CharField(choices=WORKFORCE_TYPE)

    def __str__(self):
        return f" Workforce Type {self.id}"
    
class delivery_method(models.Model):
    DELIVERY_METHOD = [
        ('In person', 'In person'),
        ('Online', 'Online'),
        ('Outreach', 'Outreach'),
        ]
    
    service_campus_key = models.ForeignKey(service_campus, on_delete=models.CASCADE)
    delivery_method = models.CharField(choices=DELIVERY_METHOD)

    def __str__(self):
        return f" Delivery Method {self.id}"
    
class region(models.Model):
    region_name = models.CharField(max_length=100)

    def __str__(self):
        return f" Region {self.region_name}"
    
class postcode(models.Model):
    region_key = models.ForeignKey(region, on_delete=models.CASCADE)
    postcode = models.CharField(max_length=10)

    def __str__(self):
        return f" Postcode {self.id}"